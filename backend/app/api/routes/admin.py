import uuid
from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies import CurrentAdmin, DbSession, require_permission
from app.auth.permissions import Permission, has_permission
from app.auth.security import hash_password
from app.auth.service import revoke_admin_sessions
from app.models.domain import AdminUser, AuditLog, Due, DueStatus, Family, Member, MembershipStatus, Payment, PaymentMethod, PaymentStatus, Role, RoleName
from app.schemas.auth import AdminUserCreate, AdminUserRead, AdminUserUpdate
from app.schemas.admin import (
    AdminDashboard, DonationRead, DueCreate, DueDetail, DueListItem, DueRead, DueUpdate,
    FamilyCreate, FamilyDetail, FamilyListItem, FamilyRead, FamilyUpdate,
    FinanceSummary, MemberCreate, MemberListItem, MemberRead, MemberUpdate,
    PaginatedDues, PaginatedFamilies, PaginatedMembers, PaginatedPayments,
    PaymentCreate, PaymentListItem, PaymentRead, RelationshipCreate, RelationshipRead,
)
from app.services import dashboard_service, family_service, finance_service, member_service

router = APIRouter(prefix="/admin")

# ── helpers ──────────────────────────────────────────────────────────────────
def _read(admin: AdminUser) -> AdminUserRead:
    return AdminUserRead(id=admin.id, email=admin.email, name=admin.name, role=admin.role.name)

def _audit(db: DbSession, actor: AdminUser, action: str, target: AdminUser) -> None:
    db.add(AuditLog(admin_user_id=actor.id, action=action, entity_type="admin_user", entity_id=str(target.id), metadata_json={"role": target.role.name}))

MembersManage = Annotated[AdminUser, Depends(require_permission(Permission.MEMBERS_MANAGE))]
MembersView   = Annotated[AdminUser, Depends(require_permission(Permission.MEMBERS_VIEW))]
DuesView      = Annotated[AdminUser, Depends(require_permission(Permission.DUES_VIEW))]
DuesManage    = Annotated[AdminUser, Depends(require_permission(Permission.DUES_MANAGE))]
PaymentsView  = Annotated[AdminUser, Depends(require_permission(Permission.PAYMENTS_VIEW))]
PaymentsManage = Annotated[AdminUser, Depends(require_permission(Permission.PAYMENTS_MANAGE))]
DonationsView = Annotated[AdminUser, Depends(require_permission(Permission.DONATIONS_VIEW))]

# ── Admin dashboard ──────────────────────────────────────────────────────────
@router.get("/dashboard", response_model=AdminDashboard)
def get_admin_dashboard(db: DbSession, actor: CurrentAdmin):
    include_finance = has_permission(actor.role.name, Permission.DUES_VIEW)
    return dashboard_service.admin_dashboard(db, include_finance=include_finance)


# ── admin-user management (Phase 5, unchanged) ────────────────────────────────
@router.get("/admin-users", response_model=list[AdminUserRead])
def list_admin_users(db: DbSession, _: AdminUser = Depends(require_permission(Permission.ADMIN_USERS_MANAGE))):
    return [_read(user) for user in db.scalars(select(AdminUser).join(AdminUser.role).order_by(AdminUser.created_at))]

@router.post("/admin-users", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
def create_admin_user(data: AdminUserCreate, db: DbSession, actor: AdminUser = Depends(require_permission(Permission.ADMIN_USERS_MANAGE))):
    if db.scalar(select(AdminUser.id).where(AdminUser.email == data.email)):
        raise HTTPException(status_code=409, detail="An administrator with that email already exists.")
    role = db.scalar(select(Role).where(Role.name == data.role))
    if not role: raise HTTPException(status_code=400, detail="The selected role is not configured.")
    user = AdminUser(email=data.email, name=data.name, auth_subject=f"local:{uuid.uuid4()}", password_hash=hash_password(data.password), role=role, is_active=True)
    db.add(user); db.flush(); _audit(db, actor, "administrator.created", user); db.commit(); db.refresh(user)
    return _read(user)

@router.patch("/admin-users/{admin_id}", response_model=AdminUserRead)
def update_admin_user(admin_id: uuid.UUID, data: AdminUserUpdate, db: DbSession, actor: AdminUser = Depends(require_permission(Permission.ADMIN_USERS_MANAGE))):
    user = db.get(AdminUser, admin_id)
    if not user: raise HTTPException(status_code=404, detail="Administrator not found.")
    changes = data.model_dump(exclude_unset=True)
    removes_super = user.role.name == RoleName.SUPER_ADMIN and (changes.get("is_active") is False or ("role" in changes and changes["role"] != RoleName.SUPER_ADMIN))
    if removes_super:
        active_super_admins = db.scalar(select(func.count()).select_from(AdminUser).join(AdminUser.role).where(Role.name == RoleName.SUPER_ADMIN, AdminUser.is_active.is_(True)))
        if active_super_admins <= 1: raise HTTPException(status_code=409, detail="At least one active Super Admin must remain.")
    if "role" in changes:
        user.role = db.scalar(select(Role).where(Role.name == changes.pop("role")))
    for field, value in changes.items(): setattr(user, field, value)
    if user.is_active is False: revoke_admin_sessions(db, user.id)
    db.flush(); _audit(db, actor, "administrator.updated", user); db.commit(); db.refresh(user)
    return _read(user)

# ── members ───────────────────────────────────────────────────────────────────
@router.get("/members", response_model=PaginatedMembers)
def list_members(
    db: DbSession, _: MembersView,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status: MembershipStatus | None = None,
    family_id: uuid.UUID | None = None,
):
    return member_service.list_members(db, page=page, page_size=page_size, search=search, status=status, family_id=family_id)

@router.post("/members", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def create_member(data: MemberCreate, db: DbSession, actor: MembersManage):
    try:
        m = member_service.create_member(db, data, actor)
        db.commit(); db.refresh(m)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return _member_read(m)

@router.get("/members/{member_id}", response_model=MemberRead)
def get_member(member_id: uuid.UUID, db: DbSession, _: MembersView):
    m = member_service.get_member(db, member_id)
    if not m: raise HTTPException(status_code=404, detail="Member not found.")
    return _member_read(m)

@router.patch("/members/{member_id}", response_model=MemberRead)
def update_member(member_id: uuid.UUID, data: MemberUpdate, db: DbSession, actor: MembersManage):
    m = member_service.get_member(db, member_id)
    if not m: raise HTTPException(status_code=404, detail="Member not found.")
    try:
        m = member_service.update_member(db, m, data, actor)
        db.commit(); db.refresh(m)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return _member_read(m)

@router.get("/members/{member_id}/relationships", response_model=list[RelationshipRead])
def list_member_relationships(member_id: uuid.UUID, db: DbSession, _: MembersView):
    if not db.get(Member, member_id): raise HTTPException(status_code=404, detail="Member not found.")
    return member_service.list_relationships(db, member_id)

@router.post("/members/{member_id}/relationships", response_model=RelationshipRead, status_code=status.HTTP_201_CREATED)
def add_member_relationship(member_id: uuid.UUID, data: RelationshipCreate, db: DbSession, actor: MembersManage):
    if not db.get(Member, member_id): raise HTTPException(status_code=404, detail="Member not found.")
    if not db.get(Member, data.member_b_id): raise HTTPException(status_code=422, detail="Target member not found.")
    if member_id == data.member_b_id: raise HTTPException(status_code=422, detail="A member cannot have a relationship with themselves.")
    try:
        rel = member_service.add_relationship(db, member_id, data, actor)
        db.commit()
    except Exception as exc:
        raise HTTPException(status_code=409, detail="This relationship already exists.")
    return rel

# ── families ──────────────────────────────────────────────────────────────────
@router.get("/families", response_model=PaginatedFamilies)
def list_families(
    db: DbSession, _: MembersView,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
):
    return family_service.list_families(db, page=page, page_size=page_size, search=search)

@router.post("/families", response_model=FamilyRead, status_code=status.HTTP_201_CREATED)
def create_family(data: FamilyCreate, db: DbSession, actor: MembersManage):
    f = family_service.create_family(db, data, actor)
    db.commit(); db.refresh(f)
    return f

@router.get("/families/{family_id}", response_model=FamilyDetail)
def get_family(family_id: uuid.UUID, db: DbSession, _: MembersView):
    f = family_service.get_family(db, family_id)
    if not f: raise HTTPException(status_code=404, detail="Family not found.")
    return _family_detail(f)

@router.patch("/families/{family_id}", response_model=FamilyRead)
def update_family(family_id: uuid.UUID, data: FamilyUpdate, db: DbSession, actor: MembersManage):
    f = family_service.get_family(db, family_id)
    if not f: raise HTTPException(status_code=404, detail="Family not found.")
    f = family_service.update_family(db, f, data, actor)
    db.commit(); db.refresh(f)
    return f

# ── finance ───────────────────────────────────────────────────────────────────
@router.get("/finance/summary", response_model=FinanceSummary)
def get_finance_summary(db: DbSession, _: DuesView):
    return finance_service.get_finance_summary(db)

@router.get("/dues", response_model=PaginatedDues)
def list_dues(
    db: DbSession,
    _: DuesView,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status: DueStatus | None = None,
    due_type: str | None = Query(None, max_length=100),
    member_id: uuid.UUID | None = None,
    family_id: uuid.UUID | None = None,
    is_overdue: bool | None = None,
):
    return finance_service.list_dues(
        db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        due_type=due_type,
        member_id=member_id,
        family_id=family_id,
        is_overdue=is_overdue,
    )

@router.post("/dues", response_model=DueRead, status_code=status.HTTP_201_CREATED)
def create_due(data: DueCreate, db: DbSession, actor: DuesManage):
    try:
        due = finance_service.create_due(db, data, actor)
        db.commit()
        db.refresh(due)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return _due_read(db, due)

@router.get("/dues/{due_id}", response_model=DueDetail)
def get_due(due_id: uuid.UUID, db: DbSession, _: DuesView):
    due = finance_service.get_due(db, due_id)
    if not due:
        raise HTTPException(status_code=404, detail="Due not found.")
    db.commit()  # In case status was refreshed
    return finance_service.get_due_detail(db, due)

@router.patch("/dues/{due_id}", response_model=DueRead)
def update_due(due_id: uuid.UUID, data: DueUpdate, db: DbSession, actor: DuesManage):
    due = db.get(Due, due_id)
    if not due:
        raise HTTPException(status_code=404, detail="Due not found.")
    try:
        due = finance_service.update_due(db, due, data, actor)
        db.commit()
        db.refresh(due)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return _due_read(db, due)

@router.post("/dues/{due_id}/cancel", response_model=DueRead)
def cancel_due(due_id: uuid.UUID, db: DbSession, actor: DuesManage):
    due = db.get(Due, due_id)
    if not due:
        raise HTTPException(status_code=404, detail="Due not found.")
    due = finance_service.cancel_due(db, due, actor)
    db.commit()
    db.refresh(due)
    return _due_read(db, due)

@router.post("/dues/{due_id}/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def record_due_payment(due_id: uuid.UUID, data: PaymentCreate, db: DbSession, actor: PaymentsManage):
    data.due_id = due_id
    try:
        payment = finance_service.record_payment(db, data, actor)
        db.commit()
        db.refresh(payment)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return _payment_read(payment)

@router.get("/dues/{due_id}/payments", response_model=list[PaymentListItem])
def list_due_payments(due_id: uuid.UUID, db: DbSession, _: PaymentsView):
    due = db.get(Due, due_id)
    if not due:
        raise HTTPException(status_code=404, detail="Due not found.")
    payments = db.scalars(
        select(Payment)
        .options(
            joinedload(Payment.member).joinedload(Member.family),
            joinedload(Payment.due).joinedload(Due.family),
            joinedload(Payment.recorded_by),
        )
        .where(Payment.due_id == due_id)
        .order_by(Payment.payment_date.desc())
    ).all()
    return [finance_service._payment_list_item(p) for p in payments]

@router.get("/payments", response_model=PaginatedPayments)
def list_payments(
    db: DbSession,
    _: PaymentsView,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    member_id: uuid.UUID | None = None,
    family_id: uuid.UUID | None = None,
    due_id: uuid.UUID | None = None,
    payment_method: PaymentMethod | None = None,
    status: PaymentStatus | None = None,
    search: str | None = Query(None, max_length=200),
):
    return finance_service.list_payments(
        db,
        page=page,
        page_size=page_size,
        member_id=member_id,
        family_id=family_id,
        due_id=due_id,
        payment_method=payment_method,
        status=status,
        search=search,
    )

@router.post("/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def record_payment(data: PaymentCreate, db: DbSession, actor: PaymentsManage):
    try:
        payment = finance_service.record_payment(db, data, actor)
        db.commit()
        db.refresh(payment)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return _payment_read(payment)

@router.get("/payments/{payment_id}", response_model=PaymentRead)
def get_payment(payment_id: uuid.UUID, db: DbSession, _: PaymentsView):
    payment = finance_service.get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")
    return _payment_read(payment)

@router.post("/payments/{payment_id}/void", response_model=PaymentRead)
def void_payment(payment_id: uuid.UUID, db: DbSession, actor: PaymentsManage):
    try:
        payment = finance_service.void_payment(db, payment_id, actor)
        db.commit()
        db.refresh(payment)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc))
    return _payment_read(payment)

@router.get("/donations", response_model=list[DonationRead])
def list_donations(db: DbSession, _: DonationsView):
    return finance_service.list_donations(db)

# ── response builders ─────────────────────────────────────────────────────────
def _member_read(m: Member) -> MemberRead:
    return MemberRead(
        id=m.id, first_name=m.first_name, middle_name=m.middle_name, last_name=m.last_name,
        date_of_birth=m.date_of_birth, phone=m.phone, email=m.email, address=m.address,
        photo_url=m.photo_url, membership_status=m.membership_status, date_joined=m.date_joined,
        notes=m.notes, family_id=m.family_id,
        family_name=m.family.family_name if m.family else None,
        created_at=m.created_at, updated_at=m.updated_at,
    )

def _family_detail(f: Family) -> FamilyDetail:
    from app.schemas.admin import MemberListItem
    return FamilyDetail(
        id=f.id, family_name=f.family_name, address=f.address, notes=f.notes,
        created_at=f.created_at, updated_at=f.updated_at,
        members=[
            MemberListItem(
                id=m.id, first_name=m.first_name, middle_name=m.middle_name, last_name=m.last_name,
                membership_status=m.membership_status, phone=m.phone, email=m.email,
                family_id=m.family_id, family_name=f.family_name,
            ) for m in f.members
        ],
    )

def _due_read(db: Session, due: Due) -> DueRead:
    paid = finance_service.payment_total_for_due(db, due)
    outstanding = max(Decimal("0"), due.amount - paid) if due.status not in (DueStatus.PAID, DueStatus.CANCELLED, DueStatus.WAIVED) else Decimal("0")
    if due.status == DueStatus.PAID:
        outstanding = Decimal("0")
    return DueRead(
        id=due.id,
        member_id=due.member_id,
        member_name=finance_service._member_name(due.member) if due.member else None,
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
    )

def _payment_read(p: Payment) -> PaymentRead:
    family_name = None
    if p.due and p.due.family:
        family_name = p.due.family.family_name
    elif p.member and p.member.family:
        family_name = p.member.family.family_name

    return PaymentRead(
        id=p.id,
        member_id=p.member_id,
        member_name=finance_service._member_name(p.member) if p.member else None,
        family_name=family_name,
        due_id=p.due_id,
        due_title=p.due.title if p.due else None,
        amount=p.amount,
        payment_date=p.payment_date,
        payment_method=p.payment_method,
        reference=p.reference,
        status=p.status,
        notes=p.notes,
        recorded_by_id=p.recorded_by_id,
        recorded_by_name=p.recorded_by.name if p.recorded_by else None,
        created_at=p.created_at,
    )
