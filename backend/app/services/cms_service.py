"""CMS service — all content management business logic."""
import re
import uuid
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.domain import (
    AdminUser, Announcement, AuditLog, Event, EventStatus,
    GalleryAlbum, GalleryImage, PageContent, PublicationStatus, Sermon,
    SermonSeries, ServiceTime, SiteSetting,
)
from app.schemas.cms import (
    AlbumCreate, AlbumUpdate, AnnouncementCreate, AnnouncementUpdate,
    EventCreate, EventUpdate, GalleryImageCreate, GalleryImageUpdate,
    PageContentUpdate, SermonCreate, SermonSeriesCreate, SermonUpdate,
    ServiceTimeCreate, ServiceTimeUpdate, SettingUpsert,
)


def _slug(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:200]
    return f"{base}-{uuid.uuid4().hex[:8]}"


def _audit(db: Session, actor: AdminUser, action: str, entity_type: str, entity_id: str, meta: dict | None = None) -> None:
    db.add(AuditLog(admin_user_id=actor.id, action=action, entity_type=entity_type, entity_id=entity_id, metadata_json=meta))


def _paged(db: Session, stmt, page: int, page_size: int):
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return items, total, pages


# ── Dashboard ─────────────────────────────────────────────────────────────────
def dashboard(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "published_events": db.scalar(select(func.count(Event.id)).where(Event.status == EventStatus.PUBLISHED)) or 0,
        "draft_events": db.scalar(select(func.count(Event.id)).where(Event.status == EventStatus.DRAFT)) or 0,
        "active_announcements": db.scalar(
            select(func.count(Announcement.id)).where(
                Announcement.status == PublicationStatus.PUBLISHED,
                (Announcement.expires_at.is_(None) | (Announcement.expires_at > now)),
            )
        ) or 0,
        "total_sermons": db.scalar(select(func.count(Sermon.id))) or 0,
        "gallery_albums": db.scalar(select(func.count(GalleryAlbum.id))) or 0,
        "service_times": db.scalar(select(func.count(ServiceTime.id)).where(ServiceTime.is_active.is_(True))) or 0,
    }


# ── Events ────────────────────────────────────────────────────────────────────
def list_events(db: Session, page: int, page_size: int, search: str | None, status: EventStatus | None):
    stmt = select(Event)
    if search:
        stmt = stmt.where(Event.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Event.status == status)
    stmt = stmt.order_by(Event.start_datetime.desc())
    items, total, pages = _paged(db, stmt, page, page_size)
    return items, total, pages


def get_event(db: Session, event_id: uuid.UUID) -> Event | None:
    return db.get(Event, event_id)


def create_event(db: Session, data: EventCreate, actor: AdminUser) -> Event:
    event = Event(**data.model_dump(), slug=_slug(data.title))
    db.add(event)
    db.flush()
    _audit(db, actor, "content.event.created", "event", str(event.id), {"title": event.title})
    return event


def update_event(db: Session, event: Event, data: EventUpdate, actor: AdminUser) -> Event:
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(event, k, v)
    db.flush()
    _audit(db, actor, "content.event.updated", "event", str(event.id), {"fields": list(changes)})
    return event


def set_event_status(db: Session, event: Event, status: EventStatus, actor: AdminUser) -> Event:
    old = event.status
    event.status = status
    db.flush()
    _audit(db, actor, f"content.event.{status.value.lower()}", "event", str(event.id), {"from": old, "to": status})
    return event


# ── Announcements ─────────────────────────────────────────────────────────────
def list_announcements(db: Session, page: int, page_size: int, search: str | None, status: PublicationStatus | None):
    stmt = select(Announcement)
    if search:
        stmt = stmt.where(Announcement.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Announcement.status == status)
    stmt = stmt.order_by(Announcement.created_at.desc())
    return _paged(db, stmt, page, page_size)


def get_announcement(db: Session, ann_id: uuid.UUID) -> Announcement | None:
    return db.get(Announcement, ann_id)


def create_announcement(db: Session, data: AnnouncementCreate, actor: AdminUser) -> Announcement:
    values = data.model_dump(exclude={"status"})
    if data.status == PublicationStatus.PUBLISHED:
        _validate_announcement_for_publish(values.get("title"), values.get("image_url"), values.get("expires_at"))
    ann = Announcement(**values, status=data.status, created_by_id=actor.id)
    db.add(ann)
    db.flush()
    _audit(db, actor, "content.announcement.created", "announcement", str(ann.id), {"title": ann.title})
    return ann


def update_announcement(db: Session, ann: Announcement, data: AnnouncementUpdate, actor: AdminUser) -> Announcement:
    changes = data.model_dump(exclude_unset=True)
    if "expires_at" in changes:
        _validate_expiry(changes["expires_at"], ann.created_at)
    for k, v in changes.items():
        setattr(ann, k, v)
    db.flush()
    _audit(db, actor, "content.announcement.updated", "announcement", str(ann.id), {"fields": list(changes)})
    return ann


def set_announcement_status(db: Session, ann: Announcement, status: PublicationStatus, actor: AdminUser) -> Announcement:
    old = ann.status
    if status == PublicationStatus.PUBLISHED:
        _validate_announcement_for_publish(ann.title, ann.image_url, ann.expires_at)
    ann.status = status
    db.flush()
    _audit(db, actor, f"content.announcement.{status.value.lower()}", "announcement", str(ann.id), {"from": old, "to": status})
    return ann


def _validate_expiry(expires_at: datetime | None, created_at: datetime | None) -> None:
    if expires_at is not None and created_at is not None and expires_at < created_at:
        raise ValueError("Expiry must not be earlier than creation time.")


def _validate_announcement_for_publish(title: str | None, image_url: str | None, expires_at: datetime | None) -> None:
    if not title or not title.strip():
        raise ValueError("Title is required to publish an announcement.")
    if not image_url:
        raise ValueError("Image is required to publish an announcement.")
    _validate_expiry(expires_at, datetime.now(timezone.utc))


# ── Sermons ───────────────────────────────────────────────────────────────────
def list_sermon_series(db: Session) -> list[SermonSeries]:
    return db.scalars(select(SermonSeries).order_by(SermonSeries.title)).all()


def create_sermon_series(db: Session, data: SermonSeriesCreate, actor: AdminUser) -> SermonSeries:
    series = SermonSeries(**data.model_dump())
    db.add(series)
    db.flush()
    _audit(db, actor, "content.series.created", "sermon_series", str(series.id), {"title": series.title})
    return series


def list_sermons(db: Session, page: int, page_size: int, search: str | None, status: PublicationStatus | None, series_id: uuid.UUID | None):
    stmt = select(Sermon).options(selectinload(Sermon.series))
    if search:
        stmt = stmt.where(Sermon.title.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Sermon.status == status)
    if series_id:
        stmt = stmt.where(Sermon.series_id == series_id)
    stmt = stmt.order_by(Sermon.date.desc())
    return _paged(db, stmt, page, page_size)


def get_sermon(db: Session, sermon_id: uuid.UUID) -> Sermon | None:
    return db.scalar(select(Sermon).options(selectinload(Sermon.series)).where(Sermon.id == sermon_id))


def create_sermon(db: Session, data: SermonCreate, actor: AdminUser) -> Sermon:
    sermon = Sermon(**data.model_dump(), slug=_slug(data.title))
    db.add(sermon)
    db.flush()
    _audit(db, actor, "content.sermon.created", "sermon", str(sermon.id), {"title": sermon.title})
    return sermon


def update_sermon(db: Session, sermon: Sermon, data: SermonUpdate, actor: AdminUser) -> Sermon:
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(sermon, k, v)
    db.flush()
    _audit(db, actor, "content.sermon.updated", "sermon", str(sermon.id), {"fields": list(changes)})
    return sermon


def set_sermon_status(db: Session, sermon: Sermon, status: PublicationStatus, actor: AdminUser) -> Sermon:
    old = sermon.status
    sermon.status = status
    db.flush()
    _audit(db, actor, f"content.sermon.{status.value.lower()}", "sermon", str(sermon.id), {"from": old, "to": status})
    return sermon


# ── Gallery ───────────────────────────────────────────────────────────────────
def list_albums(db: Session, page: int, page_size: int, status: PublicationStatus | None):
    stmt = select(GalleryAlbum).options(selectinload(GalleryAlbum.images))
    if status:
        stmt = stmt.where(GalleryAlbum.status == status)
    stmt = stmt.order_by(GalleryAlbum.created_at.desc())
    return _paged(db, stmt, page, page_size)


def get_album(db: Session, album_id: uuid.UUID) -> GalleryAlbum | None:
    return db.scalar(select(GalleryAlbum).options(selectinload(GalleryAlbum.images)).where(GalleryAlbum.id == album_id))


def create_album(db: Session, data: AlbumCreate, actor: AdminUser) -> GalleryAlbum:
    album = GalleryAlbum(**data.model_dump())
    db.add(album)
    db.flush()
    _audit(db, actor, "content.album.created", "gallery_album", str(album.id), {"title": album.title})
    return album


def update_album(db: Session, album: GalleryAlbum, data: AlbumUpdate, actor: AdminUser) -> GalleryAlbum:
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(album, k, v)
    db.flush()
    _audit(db, actor, "content.album.updated", "gallery_album", str(album.id), {"fields": list(changes)})
    return album


def set_album_status(db: Session, album: GalleryAlbum, status: PublicationStatus, actor: AdminUser) -> GalleryAlbum:
    old = album.status
    album.status = status
    db.flush()
    _audit(db, actor, f"content.album.{status.value.lower()}", "gallery_album", str(album.id), {"from": old, "to": status})
    return album


def delete_album(db: Session, album: GalleryAlbum, actor: AdminUser) -> None:
    _audit(db, actor, "content.album.deleted", "gallery_album", str(album.id), {"title": album.title})
    db.delete(album)
    db.flush()


def add_image(db: Session, album: GalleryAlbum, data: GalleryImageCreate, actor: AdminUser) -> GalleryImage:
    image = GalleryImage(album_id=album.id, **data.model_dump())
    db.add(image)
    db.flush()
    _audit(db, actor, "content.album.image_added", "gallery_image", str(image.id), {"album_id": str(album.id)})
    return image


def update_image(db: Session, image: GalleryImage, data: GalleryImageUpdate, actor: AdminUser) -> GalleryImage:
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(image, k, v)
    db.flush()
    _audit(db, actor, "content.album.image_updated", "gallery_image", str(image.id), {"fields": list(changes)})
    return image


def remove_image(db: Session, image: GalleryImage, actor: AdminUser) -> None:
    _audit(db, actor, "content.album.image_removed", "gallery_image", str(image.id), {"album_id": str(image.album_id)})
    db.delete(image)
    db.flush()


# ── Service Times ─────────────────────────────────────────────────────────────
def list_service_times(db: Session) -> list[ServiceTime]:
    return db.scalars(select(ServiceTime).order_by(ServiceTime.sort_order, ServiceTime.day_of_week, ServiceTime.start_time)).all()


def get_service_time(db: Session, st_id: uuid.UUID) -> ServiceTime | None:
    return db.get(ServiceTime, st_id)


def create_service_time(db: Session, data: ServiceTimeCreate, actor: AdminUser) -> ServiceTime:
    st = ServiceTime(**data.model_dump())
    db.add(st)
    db.flush()
    _audit(db, actor, "content.service_time.created", "service_time", str(st.id), {"name": st.service_name})
    return st


def update_service_time(db: Session, st: ServiceTime, data: ServiceTimeUpdate, actor: AdminUser) -> ServiceTime:
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(st, k, v)
    db.flush()
    _audit(db, actor, "content.service_time.updated", "service_time", str(st.id), {"fields": list(changes)})
    return st


def delete_service_time(db: Session, st: ServiceTime, actor: AdminUser) -> None:
    _audit(db, actor, "content.service_time.deleted", "service_time", str(st.id), {"name": st.service_name})
    db.delete(st)
    db.flush()


# ── Page Content ──────────────────────────────────────────────────────────────
def list_page_content(db: Session, page: str) -> list[PageContent]:
    return db.scalars(select(PageContent).where(PageContent.page == page).order_by(PageContent.section)).all()


def upsert_page_content(db: Session, page: str, section: str, data: PageContentUpdate, actor: AdminUser) -> PageContent:
    pc = db.scalar(select(PageContent).where(PageContent.page == page, PageContent.section == section))
    if pc is None:
        pc = PageContent(page=page, section=section)
        db.add(pc)
    changes = data.model_dump(exclude_unset=True)
    for k, v in changes.items():
        setattr(pc, k, v)
    db.flush()
    _audit(db, actor, "content.page.updated", "page_content", f"{page}/{section}", {"page": page, "section": section})
    return pc


# ── Site Settings ─────────────────────────────────────────────────────────────
ALLOWED_SETTINGS = frozenset({
    "church_name", "tagline", "phone", "email", "address",
    "google_maps_url", "facebook_url", "instagram_url", "youtube_url",
    "office_hours",
})


def list_settings(db: Session) -> list[SiteSetting]:
    return db.scalars(select(SiteSetting).order_by(SiteSetting.key)).all()


def upsert_setting(db: Session, key: str, data: SettingUpsert, actor: AdminUser) -> SiteSetting:
    if key not in ALLOWED_SETTINGS:
        raise ValueError(f"Unknown setting key: {key}")
    setting = db.scalar(select(SiteSetting).where(SiteSetting.key == key))
    if setting is None:
        setting = SiteSetting(key=key, value=data.value, is_public=True)
        db.add(setting)
    else:
        setting.value = data.value
    db.flush()
    _audit(db, actor, "content.settings.updated", "site_setting", key)
    return setting
