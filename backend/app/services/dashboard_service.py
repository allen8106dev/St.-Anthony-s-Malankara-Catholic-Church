"""Admin overview dashboard — aggregates data the current user is permitted to see."""
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.domain import (
    Announcement, Due, DueStatus, Event, EventStatus, Family, Member,
    MembershipStatus, Payment, PaymentStatus, PublicationStatus,
)
from app.schemas.admin import AdminDashboard, PaymentListItem
from app.services.finance_service import _payment_list_item, payment_total_for_due


def admin_dashboard(db: Session, include_finance: bool) -> AdminDashboard:
    now = datetime.now(timezone.utc)

    total_members = db.scalar(select(func.count(Member.id))) or 0
    active_members = db.scalar(
        select(func.count(Member.id)).where(Member.membership_status == MembershipStatus.ACTIVE)
    ) or 0
    total_families = db.scalar(select(func.count(Family.id))) or 0

    upcoming_events = db.scalar(
        select(func.count(Event.id)).where(
            Event.status == EventStatus.PUBLISHED,
            Event.start_datetime >= now,
        )
    ) or 0

    active_announcements = db.scalar(
        select(func.count(Announcement.id)).where(
            Announcement.status == PublicationStatus.PUBLISHED,
            (Announcement.expires_at.is_(None) | (Announcement.expires_at > now)),
        )
    ) or 0

    outstanding_dues = Decimal("0")
    total_collected = Decimal("0")
    overdue_dues = 0
    recent_payments: list[PaymentListItem] = []

    if include_finance:
        total_collected = db.scalar(
            select(func.coalesce(func.sum(Payment.amount), Decimal("0"))).where(
                Payment.status == PaymentStatus.COMPLETED
            )
        ) or Decimal("0")

        overdue_dues = db.scalar(
            select(func.count(Due.id)).where(Due.status == DueStatus.OVERDUE)
        ) or 0

        active_dues = db.scalars(
            select(Due).where(Due.status.in_([DueStatus.PENDING, DueStatus.PARTIALLY_PAID, DueStatus.OVERDUE]))
        ).all()
        outstanding_dues = sum(
            (max(Decimal("0"), d.amount - payment_total_for_due(db, d)) for d in active_dues),
            Decimal("0"),
        )

        payments = db.scalars(
            select(Payment)
            .options(
                joinedload(Payment.member).joinedload(Member.family),
                joinedload(Payment.due).joinedload(Due.family),
                joinedload(Payment.recorded_by),
            )
            .where(Payment.status == PaymentStatus.COMPLETED)
            .order_by(Payment.payment_date.desc())
            .limit(5)
        ).all()
        recent_payments = [_payment_list_item(p) for p in payments]

    return AdminDashboard(
        total_members=total_members,
        active_members=active_members,
        total_families=total_families,
        outstanding_dues=outstanding_dues,
        total_collected=total_collected,
        overdue_dues=overdue_dues,
        upcoming_events=upcoming_events,
        active_announcements=active_announcements,
        recent_payments=recent_payments,
        donations_on_hold=True,
    )
