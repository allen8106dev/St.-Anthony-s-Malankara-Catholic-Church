"""Member business logic for authenticated admin endpoints."""
import math
from uuid import UUID
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload
from app.models.domain import AuditLog, AdminUser, Family, Member, MemberRelationship, MembershipStatus
from app.schemas.admin import MemberCreate, MemberUpdate, PaginatedMembers, MemberListItem, RelationshipCreate


def _member_list_item(member: Member) -> MemberListItem:
    return MemberListItem(
        id=member.id, first_name=member.first_name, middle_name=member.middle_name,
        last_name=member.last_name, membership_status=member.membership_status,
        phone=member.phone, email=member.email, family_id=member.family_id,
        family_name=member.family.family_name if member.family else None,
    )


def list_members(
    db: Session, page: int, page_size: int,
    search: str | None = None, status: MembershipStatus | None = None,
    family_id: UUID | None = None,
) -> PaginatedMembers:
    stmt = select(Member).options(joinedload(Member.family))
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Member.first_name.ilike(term),
                Member.last_name.ilike(term),
                Member.email.ilike(term),
                Member.phone.ilike(term),
                (Member.first_name + " " + Member.last_name).ilike(term),
            )
        )
    if status:
        stmt = stmt.where(Member.membership_status == status)
    if family_id:
        stmt = stmt.where(Member.family_id == family_id)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    pages = max(1, math.ceil((total or 0) / page_size))
    offset = (page - 1) * page_size
    members = db.scalars(stmt.order_by(Member.last_name, Member.first_name).offset(offset).limit(page_size)).all()
    return PaginatedMembers(
        items=[_member_list_item(m) for m in members],
        total=total or 0, page=page, page_size=page_size, pages=pages,
    )


def get_member(db: Session, member_id: UUID) -> Member | None:
    return db.scalar(select(Member).options(joinedload(Member.family)).where(Member.id == member_id))


def create_member(db: Session, data: MemberCreate, actor: AdminUser) -> Member:
    if data.family_id is not None and db.get(Family, data.family_id) is None:
        raise ValueError("The selected family does not exist.")
    member = Member(**data.model_dump())
    db.add(member)
    db.flush()
    db.add(AuditLog(
        admin_user_id=actor.id, action="member.created",
        entity_type="member", entity_id=str(member.id),
        metadata_json={"name": f"{member.first_name} {member.last_name}"},
    ))
    return member


def update_member(db: Session, member: Member, data: MemberUpdate, actor: AdminUser) -> Member:
    values = data.model_dump(exclude_unset=True)
    if values.get("family_id") is not None and db.get(Family, values["family_id"]) is None:
        raise ValueError("The selected family does not exist.")
    old_status = member.membership_status
    for field, value in values.items():
        setattr(member, field, value)
    db.flush()
    action = "member.status_changed" if "membership_status" in values and member.membership_status != old_status else "member.updated"
    db.add(AuditLog(
        admin_user_id=actor.id, action=action,
        entity_type="member", entity_id=str(member.id),
        metadata_json={"fields": list(values.keys())},
    ))
    return member


def add_relationship(db: Session, member_a_id: UUID, data: RelationshipCreate, actor: AdminUser) -> MemberRelationship:
    rel = MemberRelationship(member_a_id=member_a_id, member_b_id=data.member_b_id, relationship_type=data.relationship_type)
    db.add(rel)
    db.flush()
    db.add(AuditLog(
        admin_user_id=actor.id, action="member.relationship_added",
        entity_type="member_relationship", entity_id=str(rel.id),
        metadata_json={"member_a": str(member_a_id), "member_b": str(data.member_b_id), "type": data.relationship_type},
    ))
    return rel


def list_relationships(db: Session, member_id: UUID) -> list[MemberRelationship]:
    return db.scalars(
        select(MemberRelationship).where(
            or_(MemberRelationship.member_a_id == member_id, MemberRelationship.member_b_id == member_id)
        )
    ).all()
