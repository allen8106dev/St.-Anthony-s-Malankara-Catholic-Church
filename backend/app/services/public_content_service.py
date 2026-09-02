"""Read-only public projections. Private models never cross this boundary."""
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload
from app.models.domain import Announcement, Event, EventStatus, GalleryAlbum, PageContent, PublicationStatus, Sermon, ServiceTime, SiteSetting

def paged(db: Session, statement, offset: int, limit: int):
    total = db.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    return db.scalars(statement.offset(offset).limit(limit)).all(), total
def events(db: Session, offset: int, limit: int, timeframe: str | None, category: str | None):
    stmt = select(Event).where(Event.status == EventStatus.PUBLISHED)
    now = datetime.now(timezone.utc)
    if timeframe == "upcoming": stmt = stmt.where(Event.start_datetime >= now)
    elif timeframe == "past": stmt = stmt.where(Event.start_datetime < now)
    if category: stmt = stmt.where(Event.category == category)
    return paged(db, stmt.order_by(Event.start_datetime), offset, limit)
def announcements(db: Session, offset: int, limit: int, announcement_types: list | None):
    now = datetime.now(timezone.utc)
    stmt = select(Announcement).where(Announcement.status == PublicationStatus.PUBLISHED, Announcement.published_at <= now, (Announcement.expires_at.is_(None) | (Announcement.expires_at > now)))
    if announcement_types:
        stmt = stmt.where(Announcement.type.in_(announcement_types))
    return paged(db, stmt.order_by(Announcement.published_at.desc()), offset, limit)
def albums(db: Session, offset: int, limit: int): return paged(db, select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.status == PublicationStatus.PUBLISHED).order_by(GalleryAlbum.created_at.desc()), offset, limit)
def sermons(db: Session, offset: int, limit: int, series_id, speaker: str | None):
    stmt = select(Sermon).where(Sermon.status == PublicationStatus.PUBLISHED)
    if series_id: stmt = stmt.where(Sermon.series_id == series_id)
    if speaker: stmt = stmt.where(Sermon.speaker_name.ilike(f"%{speaker}%"))
    return paged(db, stmt.order_by(Sermon.date.desc()), offset, limit)
def content(db: Session, page: str | None):
    stmt = select(PageContent).where(PageContent.status == PublicationStatus.PUBLISHED)
    if page: stmt = stmt.where(PageContent.page == page)
    return db.scalars(stmt.order_by(PageContent.page, PageContent.section)).all()
def settings(db: Session): return db.scalars(select(SiteSetting).where(SiteSetting.is_public.is_(True)).order_by(SiteSetting.key)).all()
def service_times(db: Session): return db.scalars(select(ServiceTime).where(ServiceTime.is_active.is_(True)).order_by(ServiceTime.day_of_week, ServiceTime.start_time)).all()
