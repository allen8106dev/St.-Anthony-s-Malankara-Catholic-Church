"""Family business logic for authenticated admin endpoints."""
import math
from uuid import UUID
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.models.domain import AuditLog, AdminUser, Family, Member
from app.schemas.admin import FamilyCreate, FamilyUpdate, FamilyListItem, PaginatedFamilies


def _family_list_item(family: Family, member_count: int) -> FamilyListItem:
    return FamilyListItem(id=family.id, family_name=family.family_name, address=family.address, member_count=member_count)


def list_families(
    db: Session, page: int, page_size: int, search: str | None = None,
) -> PaginatedFamilies:
    stmt = select(Family)
    if search:
        stmt = stmt.where(Family.family_name.ilike(f"%{search.strip()}%"))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    pages = max(1, math.ceil((total or 0) / page_size))
    offset = (page - 1) * page_size
    families = db.scalars(stmt.order_by(Family.family_name).offset(offset).limit(page_size)).all()

    # member counts in one query
    family_ids = [f.id for f in families]
    counts: dict[UUID, int] = {}
    if family_ids:
        rows = db.execute(
            select(Member.family_id, func.count().label("cnt"))
            .where(Member.family_id.in_(family_ids))
            .group_by(Member.family_id)
        ).all()
        counts = {row.family_id: row.cnt for row in rows}

    return PaginatedFamilies(
        items=[_family_list_item(f, counts.get(f.id, 0)) for f in families],
        total=total or 0, page=page, page_size=page_size, pages=pages,
    )


def get_family(db: Session, family_id: UUID) -> Family | None:
    return db.scalar(select(Family).options(joinedload(Family.members)).where(Family.id == family_id))


def create_family(db: Session, data: FamilyCreate, actor: AdminUser) -> Family:
    family = Family(**data.model_dump())
    db.add(family)
    db.flush()
    db.add(AuditLog(
        admin_user_id=actor.id, action="family.created",
        entity_type="family", entity_id=str(family.id),
        metadata_json={"name": family.family_name},
    ))
    return family


def update_family(db: Session, family: Family, data: FamilyUpdate, actor: AdminUser) -> Family:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(family, field, value)
    db.flush()
    db.add(AuditLog(
        admin_user_id=actor.id, action="family.updated",
        entity_type="family", entity_id=str(family.id),
        metadata_json={"name": family.family_name},
    ))
    return family
