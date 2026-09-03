from typing import Annotated, Literal
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from app.api.dependencies import DbSession
from app.schemas.public import PageMeta, PublicAnnouncement, PublicContent, PublicEvent, PublicGalleryAlbum, PublicSermon, PublicServiceTime, PublicSetting
from app.services import public_content_service as service

router = APIRouter(prefix="/public")
Offset = Annotated[int, Query(ge=0)]
Limit = Annotated[int, Query(ge=1, le=100)]
def page(items, total, offset, limit): return {"items": items, "meta": PageMeta(offset=offset, limit=limit, total=total)}
@router.get("/events", response_model=dict)
def list_events(db: DbSession, offset: Offset = 0, limit: Limit = 20, timeframe: Literal["upcoming", "past"] | None = None, category: str | None = None):
    items, total = service.events(db, offset, limit, timeframe, category); return page([PublicEvent.model_validate(x).model_dump() for x in items], total, offset, limit)
@router.get("/announcements", response_model=dict)
def list_announcements(db: DbSession, offset: Offset = 0, limit: Limit = 20):
    items, total = service.announcements(db, offset, limit)
    return page([PublicAnnouncement.model_validate(x).model_dump() for x in items], total, offset, limit)
@router.get("/gallery", response_model=dict)
def list_gallery(db: DbSession, offset: Offset = 0, limit: Limit = 20):
    items, total = service.albums(db, offset, limit); return page([PublicGalleryAlbum.model_validate(x).model_dump() for x in items], total, offset, limit)
@router.get("/gallery/{album_id}", response_model=PublicGalleryAlbum)
def get_gallery_album(album_id: UUID, db: DbSession):
    album = service.album_by_id(db, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return PublicGalleryAlbum.model_validate(album)
@router.get("/sermons", response_model=dict)
def list_sermons(db: DbSession, offset: Offset = 0, limit: Limit = 20, series_id: UUID | None = None, speaker: str | None = None):
    items, total = service.sermons(db, offset, limit, series_id, speaker); return page([PublicSermon.model_validate(x).model_dump() for x in items], total, offset, limit)
@router.get("/content", response_model=list[PublicContent])
def list_content(db: DbSession, page: str | None = None): return service.content(db, page)
@router.get("/settings", response_model=list[PublicSetting])
def list_settings(db: DbSession): return service.settings(db)
@router.get("/service-times", response_model=list[PublicServiceTime])
def list_service_times(db: DbSession): return service.service_times(db)
