"""Private financial operations. Payment gateway handling is intentionally absent."""
import math
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.domain import AdminUser, AuditLog, Donation, Due, DueStatus, Family, Member, Payment, PaymentMethod, PaymentStatus
from app.schemas.admin import (
    DonationCreate, DueCreate, DueDetail, DueListItem, DueRead, DueUpdate,
    FinanceSummary, PaginatedDues, PaginatedPayments, PaymentCreate, PaymentListItem, PaymentRead,
)


def payment_total_for_due(db: Session, due: Due) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), Decimal("0"))).where(
            Payment.due_id == due.id,
            Payment.status == PaymentStatus.COMPLETED,
        )
    )
    return total or Decimal("0")


def refresh_due_status(db: Session, due: Due) -> Due:
    if due.status in (DueStatus.WAIVED, DueStatus.CANCELLED):
        return due
    paid = payment_total_for_due(db, due)
    if paid >= due.amount:
        due.status = DueStatus.PAID
    elif paid > 0:
        due.status = DueStatus.PARTIALLY_PAID
    elif due.due_date and due.due_date < date.today():
        due.status = DueStatus.OVERDUE
    else:
        due.status = DueStatus.PENDING
    db.flush()
    return due


def _member_name(m: Member | None) -> str | None:
    if not m:
        return None
    parts = [m.first_name, m.middle_name, m.last_name]
    return " ".join(p for p in parts if p)


def _due_list_item(db: Session, due: Due) -> DueListItem:
    paid = payment_total_for_due(db, due)
    outstanding = max(Decimal("0"), due.amount - paid) if due.status not in (DueStatus.PAID, DueStatus.CANCELLED, DueStatus.WAIVED) else Decimal("0")
    if due.status == DueStatus.PAID:
        outstanding = Decimal("0")
    return DueListItem(
        id=due.id,
        member_id=due.member_id,
        member_name=_member_name(due.member) if due.member else None,
        family_id=due.family_id,
        family_name=due.family.family_name if due.family else None,
        title=due.title,
        due_type=due.due_type,
        amount=due.amount,
        amount_paid=paid,
        outstanding=outstanding,
        due_date=due.due_date,
        status=due.status,
        created_at=due.created_at,
    )


def _payment_list_item(p: Payment) -> PaymentListItem:
    family_name = None
    if p.due and p.due.family:
        family_name = p.due.family.family_name
    elif p.member and p.member.family:
        family_name = p.member.family.family_name

    return PaymentListItem(
        id=p.id,
        member_id=p.member_id,
        member_name=_member_name(p.member) if p.member else None,
        family_name=family_name,
        due_id=p.due_id,
        due_title=p.due.title if p.due else None,
        amount=p.amount,
        payment_date=p.payment_date,
        payment_method=p.payment_method,
        reference=p.reference,
        status=p.status,
        recorded_by_id=p.recorded_by_id,
        recorded_by_name=p.recorded_by.name if p.recorded_by else None,
        created_at=p.created_at,
    )


def list_dues(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    status: DueStatus | None = None,
    due_type: str | None = None,
    member_id: UUID | None = None,
    family_id: UUID | None = None,
    is_overdue: bool | None = None,
) -> PaginatedDues:
    stmt = select(Due).options(joinedload(Due.member), joinedload(Due.family))

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.outerjoin(Due.member).outerjoin(Due.family).where(
            or_(
                Due.title.ilike(term),
                Due.description.ilike(term),
                Due.due_type.ilike(term),
                Member.first_name.ilike(term),
                Member.last_name.ilike(term),
                Family.family_name.ilike(term),
            )
        )
    if status:
        stmt = stmt.where(Due.status == status)
    if due_type:
        stmt = stmt.where(Due.due_type == due_type)
    if member_id:
        stmt = stmt.where(Due.member_id == member_id)
    if family_id:
        stmt = stmt.where(Due.family_id == family_id)
    if is_overdue is True:
        stmt = stmt.where(Due.status == DueStatus.OVERDUE)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size
    dues = db.scalars(stmt.order_by(Due.created_at.desc()).offset(offset).limit(page_size)).all()

    return PaginatedDues(
        items=[_due_list_item(db, d) for d in dues],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_due(db: Session, due_id: UUID) -> Due | None:
    due = db.scalar(
        select(Due)
        .options(
            joinedload(Due.member),
            joinedload(Due.family),
            joinedload(Due.payments).joinedload(Payment.member),
            joinedload(Due.payments).joinedload(Payment.recorded_by),
        )
        .where(Due.id == due_id)
    )
    if due and due.status not in (DueStatus.PAID, DueStatus.CANCELLED, DueStatus.WAIVED):
        refresh_due_status(db, due)
    return due


def get_due_detail(db: Session, due: Due) -> DueDetail:
    paid = payment_total_for_due(db, due)
    outstanding = max(Decimal("0"), due.amount - paid) if due.status not in (DueStatus.PAID, DueStatus.CANCELLED, DueStatus.WAIVED) else Decimal("0")
    if due.status == DueStatus.PAID:
        outstanding = Decimal("0")

    payments = db.scalars(
        select(Payment)
        .options(joinedload(Payment.member), joinedload(Payment.recorded_by), joinedload(Payment.due))
        .where(Payment.due_id == due.id)
        .order_by(Payment.payment_date.desc())
    ).all()

    return DueDetail(
        id=due.id,
        member_id=due.member_id,
        member_name=_member_name(due.member) if due.member else None,
        family_id=due.family_id,
        family_name=due.family.family_name if due.family else None,
        title=due.title,
        due_type=due.due_type,
        description=due.description,
        amount=due.amount,
        amount_paid=paid,
        outstanding=outstanding,
        due_date=due.due_date,
        period_start=due.period_start,
        period_end=due.period_end,
        status=due.status,
        created_at=due.created_at,
        updated_at=due.updated_at,
        payments=[_payment_list_item(p) for p in payments],
    )


def create_due(db: Session, data: DueCreate, actor: AdminUser) -> Due:
    if data.member_id is not None and db.get(Member, data.member_id) is None:
        raise ValueError("The selected member does not exist.")
    if data.family_id is not None and db.get(Family, data.family_id) is None:
        raise ValueError("The selected family does not exist.")

    due_data = data.model_dump()
    if data.due_date and data.due_date < date.today() and data.status == DueStatus.PENDING:
        due_data["status"] = DueStatus.OVERDUE

    due = Due(**due_data)
    db.add(due)
    db.flush()

    db.add(
        AuditLog(
            admin_user_id=actor.id,
            action="due.created",
            entity_type="due",
            entity_id=str(due.id),
            metadata_json={
                "title": due.title,
                "amount": str(due.amount),
                "due_type": due.due_type,
                "member_id": str(due.member_id) if due.member_id else None,
                "family_id": str(due.family_id) if due.family_id else None,
            },
        )
    )
    return due


def update_due(db: Session, due: Due, data: DueUpdate, actor: AdminUser) -> Due:
    values = data.model_dump(exclude_unset=True)
    if "amount" in values and values["amount"] is not None:
        paid = payment_total_for_due(db, due)
        if values["amount"] < paid:
            raise ValueError(f"Due amount cannot be reduced below the already collected amount of {paid}.")

    for field, value in values.items():
        setattr(due, field, value)

    refresh_due_status(db, due)
    db.flush()

    db.add(
        AuditLog(
            admin_user_id=actor.id,
            action="due.updated",
            entity_type="due",
            entity_id=str(due.id),
            metadata_json={"fields": list(values.keys())},
        )
    )
    return due


def cancel_due(db: Session, due: Due, actor: AdminUser) -> Due:
    if due.status == DueStatus.CANCELLED:
        return due
    due.status = DueStatus.CANCELLED
    db.flush()

    db.add(
        AuditLog(
            admin_user_id=actor.id,
            action="due.cancelled",
            entity_type="due",
            entity_id=str(due.id),
            metadata_json={"title": due.title, "amount": str(due.amount)},
        )
    )
    return due


def record_payment(db: Session, data: PaymentCreate, actor: AdminUser) -> Payment:
    if data.amount <= Decimal("0"):
        raise ValueError("Payment amount must be greater than zero.")

    if data.member_id is not None and db.get(Member, data.member_id) is None:
        raise ValueError("The selected member does not exist.")

    due: Due | None = None
    if data.due_id is not None:
        due = db.get(Due, data.due_id)
        if due is None:
            raise ValueError("The selected due does not exist.")
        if due.status == DueStatus.CANCELLED:
            raise ValueError("Cannot record a payment against a cancelled due.")
        if due.status == DueStatus.WAIVED:
            raise ValueError("Cannot record a payment against a waived due.")
        if due.status == DueStatus.PAID:
            raise ValueError("This due is already fully paid.")

        if due.member_id is not None and data.member_id is not None and due.member_id != data.member_id:
            raise ValueError("The payment member must match the due recipient member.")

        paid_already = payment_total_for_due(db, due)
        outstanding = due.amount - paid_already
        if data.amount > outstanding:
            raise ValueError(f"Payment amount ({data.amount}) exceeds the remaining outstanding balance ({outstanding}).")

        if data.member_id is None and due.member_id is not None:
            data.member_id = due.member_id

    payment = Payment(
        member_id=data.member_id,
        due_id=data.due_id,
        recorded_by_id=actor.id,
        amount=data.amount,
        payment_date=data.payment_date,
        payment_method=data.payment_method,
        reference=data.reference,
        status=PaymentStatus.COMPLETED,
        notes=data.notes,
    )
    db.add(payment)
    db.flush()

    if due is not None:
        refresh_due_status(db, due)

    db.add(
        AuditLog(
            admin_user_id=actor.id,
            action="payment.recorded",
            entity_type="payment",
            entity_id=str(payment.id),
            metadata_json={
                "amount": str(payment.amount),
                "due_id": str(payment.due_id) if payment.due_id else None,
                "member_id": str(payment.member_id) if payment.member_id else None,
                "method": payment.payment_method.value,
                "reference": payment.reference,
            },
        )
    )
    return payment


def void_payment(db: Session, payment_id: UUID, actor: AdminUser) -> Payment:
    payment = db.get(Payment, payment_id)
    if not payment:
        raise ValueError("Payment not found.")
    if payment.status == PaymentStatus.VOID:
        raise ValueError("Payment is already voided.")

    payment.status = PaymentStatus.VOID
    db.flush()

    if payment.due_id is not None:
        due = db.get(Due, payment.due_id)
        if due:
            refresh_due_status(db, due)

    db.add(
        AuditLog(
            admin_user_id=actor.id,
            action="payment.voided",
            entity_type="payment",
            entity_id=str(payment.id),
            metadata_json={"amount": str(payment.amount), "due_id": str(payment.due_id) if payment.due_id else None},
        )
    )
    return payment


def get_payment(db: Session, payment_id: UUID) -> Payment | None:
    return db.scalar(
        select(Payment)
        .options(
            joinedload(Payment.member).joinedload(Member.family),
            joinedload(Payment.due).joinedload(Due.family),
            joinedload(Payment.recorded_by),
        )
        .where(Payment.id == payment_id)
    )


def list_payments(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    member_id: UUID | None = None,
    family_id: UUID | None = None,
    due_id: UUID | None = None,
    payment_method: PaymentMethod | None = None,
    status: PaymentStatus | None = None,
    search: str | None = None,
) -> PaginatedPayments:
    stmt = (
        select(Payment)
        .options(
            joinedload(Payment.member).joinedload(Member.family),
            joinedload(Payment.due).joinedload(Due.family),
            joinedload(Payment.recorded_by),
        )
    )

    if due_id:
        stmt = stmt.where(Payment.due_id == due_id)
    if member_id:
        stmt = stmt.where(Payment.member_id == member_id)
    if family_id:
        stmt = stmt.outerjoin(Payment.due).where(
            or_(Payment.member.has(Member.family_id == family_id), Due.family_id == family_id)
        )
    if payment_method:
        stmt = stmt.where(Payment.payment_method == payment_method)
    if status:
        stmt = stmt.where(Payment.status == status)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.outerjoin(Payment.member).outerjoin(Payment.due).where(
            or_(
                Payment.reference.ilike(term),
                Payment.notes.ilike(term),
                Member.first_name.ilike(term),
                Member.last_name.ilike(term),
                Due.title.ilike(term),
            )
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size
    payments = db.scalars(stmt.order_by(Payment.payment_date.desc()).offset(offset).limit(page_size)).all()

    return PaginatedPayments(
        items=[_payment_list_item(p) for p in payments],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


def get_finance_summary(db: Session) -> FinanceSummary:
    total_collected = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), Decimal("0"))).where(
            Payment.status == PaymentStatus.COMPLETED
        )
    ) or Decimal("0")

    # Dues counts
    counts = dict(
        db.execute(
            select(Due.status, func.count(Due.id)).group_by(Due.status)
        ).all()
    )

    count_unpaid = counts.get(DueStatus.PENDING, 0)
    count_partially_paid = counts.get(DueStatus.PARTIALLY_PAID, 0)
    count_paid = counts.get(DueStatus.PAID, 0)
    count_overdue = counts.get(DueStatus.OVERDUE, 0)

    # Calculate total outstanding across active (non-cancelled, non-waived, non-paid) dues
    active_dues = db.scalars(
        select(Due).where(Due.status.in_([DueStatus.PENDING, DueStatus.PARTIALLY_PAID, DueStatus.OVERDUE]))
    ).all()
    total_outstanding = sum(
        (max(Decimal("0"), d.amount - payment_total_for_due(db, d)) for d in active_dues),
        Decimal("0"),
    )

    recent_payments = db.scalars(
        select(Payment)
        .options(
            joinedload(Payment.member).joinedload(Member.family),
            joinedload(Payment.due).joinedload(Due.family),
            joinedload(Payment.recorded_by),
        )
        .where(Payment.status == PaymentStatus.COMPLETED)
        .order_by(Payment.payment_date.desc())
        .limit(10)
    ).all()

    return FinanceSummary(
        total_outstanding=total_outstanding,
        total_collected=total_collected,
        count_unpaid=count_unpaid,
        count_partially_paid=count_partially_paid,
        count_paid=count_paid,
        count_overdue=count_overdue,
        recent_payments=[_payment_list_item(p) for p in recent_payments],
    )


def create_donation(db: Session, data: DonationCreate) -> Donation:
    donation = Donation(**data.model_dump(), payment_status=PaymentStatus.PENDING)
    db.add(donation)
    db.flush()
    return donation


def list_donations(db: Session) -> list[Donation]:
    return db.scalars(select(Donation).order_by(Donation.donated_at.desc())).all()
