"""CMS admin routes — all require content:manage permission."""
import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from app.api.dependencies import DbSession, require_permission
from app.auth.permissions import Permission
from app.models.domain import AdminUser, EventStatus, PublicationStatus
from app.schemas.cms import (
    AlbumCreate, AlbumRead, AlbumUpdate,
    AnnouncementCreate, AnnouncementRead, AnnouncementUpdate,
    CmsDashboard, EventCreate, EventRead, EventUpdate,
    GalleryImageCreate, GalleryImageRead, GalleryImageUpdate,
    PageContentRead, PageContentUpdate,
    PaginatedAlbums, PaginatedAnnouncements, PaginatedEvents, PaginatedSermons,
    SermonCreate, SermonRead, SermonSeriesCreate, SermonSeriesRead, SermonUpdate,
    ServiceTimeCreate, ServiceTimeRead, ServiceTimeUpdate,
    SettingRead, SettingUpsert,
)
from app.services import cms_service as svc
from app.services.storage_service import upload_image

router = APIRouter(prefix="/admin/cms")
ContentManage = Annotated[AdminUser, Depends(require_permission(Permission.CONTENT_MANAGE))]

@router.post("/uploads/image")
async def upload_cms_image(_: ContentManage, file: UploadFile = File(...)):
    return {"url": await upload_image(file)}


# ── Dashboard ─────────────────────────────────────────────────────────────────
@router.get("/dashboard", response_model=CmsDashboard)
def cms_dashboard(db: DbSession, _: ContentManage):
    return svc.dashboard(db)


# ── Events ────────────────────────────────────────────────────────────────────
@router.get("/events", response_model=PaginatedEvents)
def list_events(
    db: DbSession, _: ContentManage,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status: EventStatus | None = None,
):
    items, total, pages = svc.list_events(db, page, page_size, search, status)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(data: EventCreate, db: DbSession, actor: ContentManage):
    event = svc.create_event(db, data, actor)
    db.commit(); db.refresh(event)
    return event


@router.get("/events/{event_id}", response_model=EventRead)
def get_event(event_id: uuid.UUID, db: DbSession, _: ContentManage):
    event = svc.get_event(db, event_id)
    if not event: raise HTTPException(404, "Event not found.")
    return event


@router.patch("/events/{event_id}", response_model=EventRead)
def update_event(event_id: uuid.UUID, data: EventUpdate, db: DbSession, actor: ContentManage):
    event = svc.get_event(db, event_id)
    if not event: raise HTTPException(404, "Event not found.")
    event = svc.update_event(db, event, data, actor)
    db.commit(); db.refresh(event)
    return event


@router.post("/events/{event_id}/publish", response_model=EventRead)
def publish_event(event_id: uuid.UUID, db: DbSession, actor: ContentManage):
    event = svc.get_event(db, event_id)
    if not event: raise HTTPException(404, "Event not found.")
    event = svc.set_event_status(db, event, EventStatus.PUBLISHED, actor)
    db.commit(); db.refresh(event)
    return event


@router.post("/events/{event_id}/unpublish", response_model=EventRead)
def unpublish_event(event_id: uuid.UUID, db: DbSession, actor: ContentManage):
    event = svc.get_event(db, event_id)
    if not event: raise HTTPException(404, "Event not found.")
    event = svc.set_event_status(db, event, EventStatus.DRAFT, actor)
    db.commit(); db.refresh(event)
    return event


@router.post("/events/{event_id}/archive", response_model=EventRead)
def archive_event(event_id: uuid.UUID, db: DbSession, actor: ContentManage):
    event = svc.get_event(db, event_id)
    if not event: raise HTTPException(404, "Event not found.")
    # EventStatus uses CANCELLED/COMPLETED rather than ARCHIVED; map to CANCELLED
    event = svc.set_event_status(db, event, EventStatus.CANCELLED, actor)
    db.commit(); db.refresh(event)
    return event


# ── Announcements ─────────────────────────────────────────────────────────────
@router.get("/announcements", response_model=PaginatedAnnouncements)
def list_announcements(
    db: DbSession, _: ContentManage,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status: PublicationStatus | None = None,
):
    items, total, pages = svc.list_announcements(db, page, page_size, search, status)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/announcements", response_model=AnnouncementRead, status_code=status.HTTP_201_CREATED)
def create_announcement(data: AnnouncementCreate, db: DbSession, actor: ContentManage):
    ann = svc.create_announcement(db, data, actor)
    db.commit(); db.refresh(ann)
    return ann


@router.get("/announcements/{ann_id}", response_model=AnnouncementRead)
def get_announcement(ann_id: uuid.UUID, db: DbSession, _: ContentManage):
    ann = svc.get_announcement(db, ann_id)
    if not ann: raise HTTPException(404, "Announcement not found.")
    return ann


@router.patch("/announcements/{ann_id}", response_model=AnnouncementRead)
def update_announcement(ann_id: uuid.UUID, data: AnnouncementUpdate, db: DbSession, actor: ContentManage):
    ann = svc.get_announcement(db, ann_id)
    if not ann: raise HTTPException(404, "Announcement not found.")
    try:
        ann = svc.update_announcement(db, ann, data, actor)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    db.commit(); db.refresh(ann)
    return ann


@router.post("/announcements/{ann_id}/publish", response_model=AnnouncementRead)
def publish_announcement(ann_id: uuid.UUID, db: DbSession, actor: ContentManage):
    ann = svc.get_announcement(db, ann_id)
    if not ann: raise HTTPException(404, "Announcement not found.")
    try:
        ann = svc.set_announcement_status(db, ann, PublicationStatus.PUBLISHED, actor)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    db.commit(); db.refresh(ann)
    return ann


@router.post("/announcements/{ann_id}/unpublish", response_model=AnnouncementRead)
def unpublish_announcement(ann_id: uuid.UUID, db: DbSession, actor: ContentManage):
    ann = svc.get_announcement(db, ann_id)
    if not ann: raise HTTPException(404, "Announcement not found.")
    ann = svc.set_announcement_status(db, ann, PublicationStatus.DRAFT, actor)
    db.commit(); db.refresh(ann)
    return ann


@router.post("/announcements/{ann_id}/archive", response_model=AnnouncementRead)
def archive_announcement(ann_id: uuid.UUID, db: DbSession, actor: ContentManage):
    ann = svc.get_announcement(db, ann_id)
    if not ann: raise HTTPException(404, "Announcement not found.")
    ann = svc.set_announcement_status(db, ann, PublicationStatus.ARCHIVED, actor)
    db.commit(); db.refresh(ann)
    return ann


# ── Sermon Series ─────────────────────────────────────────────────────────────
@router.get("/sermon-series", response_model=list[SermonSeriesRead])
def list_sermon_series(db: DbSession, _: ContentManage):
    return svc.list_sermon_series(db)


@router.post("/sermon-series", response_model=SermonSeriesRead, status_code=status.HTTP_201_CREATED)
def create_sermon_series(data: SermonSeriesCreate, db: DbSession, actor: ContentManage):
    series = svc.create_sermon_series(db, data, actor)
    db.commit(); db.refresh(series)
    return series


# ── Sermons ───────────────────────────────────────────────────────────────────
@router.get("/sermons", response_model=PaginatedSermons)
def list_sermons(
    db: DbSession, _: ContentManage,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    status: PublicationStatus | None = None,
    series_id: uuid.UUID | None = None,
):
    items, total, pages = svc.list_sermons(db, page, page_size, search, status, series_id)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/sermons", response_model=SermonRead, status_code=status.HTTP_201_CREATED)
def create_sermon(data: SermonCreate, db: DbSession, actor: ContentManage):
    sermon = svc.create_sermon(db, data, actor)
    db.commit()
    return svc.get_sermon(db, sermon.id)


@router.get("/sermons/{sermon_id}", response_model=SermonRead)
def get_sermon(sermon_id: uuid.UUID, db: DbSession, _: ContentManage):
    sermon = svc.get_sermon(db, sermon_id)
    if not sermon: raise HTTPException(404, "Sermon not found.")
    return sermon


@router.patch("/sermons/{sermon_id}", response_model=SermonRead)
def update_sermon(sermon_id: uuid.UUID, data: SermonUpdate, db: DbSession, actor: ContentManage):
    sermon = svc.get_sermon(db, sermon_id)
    if not sermon: raise HTTPException(404, "Sermon not found.")
    svc.update_sermon(db, sermon, data, actor)
    db.commit()
    return svc.get_sermon(db, sermon_id)


@router.post("/sermons/{sermon_id}/publish", response_model=SermonRead)
def publish_sermon(sermon_id: uuid.UUID, db: DbSession, actor: ContentManage):
    sermon = svc.get_sermon(db, sermon_id)
    if not sermon: raise HTTPException(404, "Sermon not found.")
    svc.set_sermon_status(db, sermon, PublicationStatus.PUBLISHED, actor)
    db.commit()
    return svc.get_sermon(db, sermon_id)


@router.post("/sermons/{sermon_id}/unpublish", response_model=SermonRead)
def unpublish_sermon(sermon_id: uuid.UUID, db: DbSession, actor: ContentManage):
    sermon = svc.get_sermon(db, sermon_id)
    if not sermon: raise HTTPException(404, "Sermon not found.")
    svc.set_sermon_status(db, sermon, PublicationStatus.DRAFT, actor)
    db.commit()
    return svc.get_sermon(db, sermon_id)


@router.post("/sermons/{sermon_id}/archive", response_model=SermonRead)
def archive_sermon(sermon_id: uuid.UUID, db: DbSession, actor: ContentManage):
    sermon = svc.get_sermon(db, sermon_id)
    if not sermon: raise HTTPException(404, "Sermon not found.")
    svc.set_sermon_status(db, sermon, PublicationStatus.ARCHIVED, actor)
    db.commit()
    return svc.get_sermon(db, sermon_id)


# ── Gallery ───────────────────────────────────────────────────────────────────
@router.get("/gallery", response_model=PaginatedAlbums)
def list_albums(
    db: DbSession, _: ContentManage,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: PublicationStatus | None = None,
):
    items, total, pages = svc.list_albums(db, page, page_size, status)
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.post("/gallery", response_model=AlbumRead, status_code=status.HTTP_201_CREATED)
def create_album(data: AlbumCreate, db: DbSession, actor: ContentManage):
    album = svc.create_album(db, data, actor)
    db.commit()
    return svc.get_album(db, album.id)


@router.get("/gallery/{album_id}", response_model=AlbumRead)
def get_album(album_id: uuid.UUID, db: DbSession, _: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    return album


@router.patch("/gallery/{album_id}", response_model=AlbumRead)
def update_album(album_id: uuid.UUID, data: AlbumUpdate, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    svc.update_album(db, album, data, actor)
    db.commit()
    return svc.get_album(db, album_id)


@router.post("/gallery/{album_id}/publish", response_model=AlbumRead)
def publish_album(album_id: uuid.UUID, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    svc.set_album_status(db, album, PublicationStatus.PUBLISHED, actor)
    db.commit()
    return svc.get_album(db, album_id)


@router.post("/gallery/{album_id}/unpublish", response_model=AlbumRead)
def unpublish_album(album_id: uuid.UUID, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    svc.set_album_status(db, album, PublicationStatus.DRAFT, actor)
    db.commit()
    return svc.get_album(db, album_id)


@router.post("/gallery/{album_id}/archive", response_model=AlbumRead)
def archive_album(album_id: uuid.UUID, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    svc.set_album_status(db, album, PublicationStatus.ARCHIVED, actor)
    db.commit()
    return svc.get_album(db, album_id)


@router.delete("/gallery/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_album(album_id: uuid.UUID, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    svc.delete_album(db, album, actor)
    db.commit()


@router.post("/gallery/{album_id}/images", response_model=GalleryImageRead, status_code=status.HTTP_201_CREATED)
def add_image(album_id: uuid.UUID, data: GalleryImageCreate, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    image = svc.add_image(db, album, data, actor)
    db.commit(); db.refresh(image)
    return image


@router.patch("/gallery/{album_id}/images/{image_id}", response_model=GalleryImageRead)
def update_image(album_id: uuid.UUID, image_id: uuid.UUID, data: GalleryImageUpdate, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    image = next((i for i in album.images if i.id == image_id), None)
    if not image: raise HTTPException(404, "Image not found.")
    image = svc.update_image(db, image, data, actor)
    db.commit(); db.refresh(image)
    return image


@router.delete("/gallery/{album_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_image(album_id: uuid.UUID, image_id: uuid.UUID, db: DbSession, actor: ContentManage):
    album = svc.get_album(db, album_id)
    if not album: raise HTTPException(404, "Album not found.")
    image = next((i for i in album.images if i.id == image_id), None)
    if not image: raise HTTPException(404, "Image not found.")
    svc.remove_image(db, image, actor)
    db.commit()


# ── Service Times ─────────────────────────────────────────────────────────────
@router.get("/service-times", response_model=list[ServiceTimeRead])
def list_service_times(db: DbSession, _: ContentManage):
    return svc.list_service_times(db)


@router.post("/service-times", response_model=ServiceTimeRead, status_code=status.HTTP_201_CREATED)
def create_service_time(data: ServiceTimeCreate, db: DbSession, actor: ContentManage):
    st = svc.create_service_time(db, data, actor)
    db.commit(); db.refresh(st)
    return st


@router.patch("/service-times/{st_id}", response_model=ServiceTimeRead)
def update_service_time(st_id: uuid.UUID, data: ServiceTimeUpdate, db: DbSession, actor: ContentManage):
    st = svc.get_service_time(db, st_id)
    if not st: raise HTTPException(404, "Service time not found.")
    st = svc.update_service_time(db, st, data, actor)
    db.commit(); db.refresh(st)
    return st


@router.delete("/service-times/{st_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service_time(st_id: uuid.UUID, db: DbSession, actor: ContentManage):
    st = svc.get_service_time(db, st_id)
    if not st: raise HTTPException(404, "Service time not found.")
    svc.delete_service_time(db, st, actor)
    db.commit()


# ── Page Content ──────────────────────────────────────────────────────────────
@router.get("/content/{page}", response_model=list[PageContentRead])
def list_page_content(page: str, db: DbSession, _: ContentManage):
    return svc.list_page_content(db, page)


@router.put("/content/{page}/{section}", response_model=PageContentRead)
def upsert_page_content(page: str, section: str, data: PageContentUpdate, db: DbSession, actor: ContentManage):
    pc = svc.upsert_page_content(db, page, section, data, actor)
    db.commit(); db.refresh(pc)
    return pc


# ── Site Settings ─────────────────────────────────────────────────────────────
@router.get("/settings", response_model=list[SettingRead])
def list_settings(db: DbSession, _: ContentManage):
    return svc.list_settings(db)


@router.put("/settings/{key}", response_model=SettingRead)
def upsert_setting(key: str, data: SettingUpsert, db: DbSession, actor: ContentManage):
    try:
        setting = svc.upsert_setting(db, key, data, actor)
        db.commit(); db.refresh(setting)
        return setting
    except ValueError as exc:
        raise HTTPException(400, str(exc))
