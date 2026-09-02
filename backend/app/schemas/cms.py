"""CMS admin schemas — never exposed through public routes."""
from datetime import date as Date, datetime, time
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.domain import AnnouncementType, EventStatus, PublicationStatus


class CmsModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Events ────────────────────────────────────────────────────────────────────
class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str | None = None
    start_datetime: datetime
    end_datetime: datetime | None = None
    location: str | None = Field(default=None, max_length=250)
    image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=100)
    status: EventStatus = EventStatus.DRAFT

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    location: str | None = Field(default=None, max_length=250)
    image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=100)
    status: EventStatus | None = None

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class EventRead(CmsModel):
    id: UUID
    title: str
    slug: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime | None
    location: str | None
    image_url: str | None
    category: str | None
    status: EventStatus
    created_at: datetime
    updated_at: datetime


class PaginatedEvents(BaseModel):
    items: list[EventRead]
    total: int
    page: int
    page_size: int
    pages: int


# ── Announcements ─────────────────────────────────────────────────────────────
class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str | None = None
    type: AnnouncementType = AnnouncementType.GENERAL
    image_url: str | None = Field(default=None, max_length=2048)
    published_at: datetime | None = None
    expires_at: datetime | None = None
    status: PublicationStatus = PublicationStatus.DRAFT

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    type: AnnouncementType | None = None
    image_url: str | None = Field(default=None, max_length=2048)
    published_at: datetime | None = None
    expires_at: datetime | None = None
    status: PublicationStatus | None = None

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class AnnouncementRead(CmsModel):
    id: UUID
    title: str
    slug: str
    description: str | None
    type: AnnouncementType
    image_url: str | None
    published_at: datetime | None
    expires_at: datetime | None
    status: PublicationStatus
    created_at: datetime
    updated_at: datetime


class PaginatedAnnouncements(BaseModel):
    items: list[AnnouncementRead]
    total: int
    page: int
    page_size: int
    pages: int


# ── Sermons ───────────────────────────────────────────────────────────────────
class SermonSeriesCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str | None = None


class SermonSeriesRead(CmsModel):
    id: UUID
    title: str
    description: str | None


class SermonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    speaker_name: str | None = Field(default=None, max_length=200)
    date: Date
    scripture_reference: str | None = Field(default=None, max_length=500)
    description: str | None = None
    video_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    series_id: UUID | None = None
    status: PublicationStatus = PublicationStatus.DRAFT

    @field_validator("video_url", "thumbnail_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must be absolute")
        return v


class SermonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    speaker_name: str | None = Field(default=None, max_length=200)
    date: Date | None = None
    scripture_reference: str | None = Field(default=None, max_length=500)
    description: str | None = None
    video_url: str | None = Field(default=None, max_length=2048)
    thumbnail_url: str | None = Field(default=None, max_length=2048)
    series_id: UUID | None = None
    status: PublicationStatus | None = None

    @field_validator("video_url", "thumbnail_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must be absolute")
        return v


class SermonRead(CmsModel):
    id: UUID
    title: str
    slug: str
    speaker_name: str | None
    date: Date
    scripture_reference: str | None
    description: str | None
    video_url: str | None
    thumbnail_url: str | None
    series_id: UUID | None
    series: SermonSeriesRead | None
    status: PublicationStatus
    created_at: datetime
    updated_at: datetime


class PaginatedSermons(BaseModel):
    items: list[SermonRead]
    total: int
    page: int
    page_size: int
    pages: int


# ── Gallery ───────────────────────────────────────────────────────────────────
class GalleryImageCreate(BaseModel):
    image_url: str = Field(max_length=2048)
    alt_text: str = Field(min_length=1, max_length=500)
    caption: str | None = None
    sort_order: int = 0

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class GalleryImageUpdate(BaseModel):
    alt_text: str | None = Field(default=None, min_length=1, max_length=500)
    caption: str | None = None
    sort_order: int | None = None


class GalleryImageRead(CmsModel):
    id: UUID
    image_url: str
    alt_text: str
    caption: str | None
    sort_order: int


class AlbumCreate(BaseModel):
    title: str = Field(min_length=1, max_length=250)
    description: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=2048)
    status: PublicationStatus = PublicationStatus.DRAFT

    @field_validator("cover_image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("cover_image_url must be an absolute URL")
        return v


class AlbumUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=250)
    description: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=2048)
    status: PublicationStatus | None = None

    @field_validator("cover_image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("cover_image_url must be an absolute URL")
        return v


class AlbumRead(CmsModel):
    id: UUID
    title: str
    description: str | None
    cover_image_url: str | None
    status: PublicationStatus
    images: list[GalleryImageRead] = []
    created_at: datetime
    updated_at: datetime


class PaginatedAlbums(BaseModel):
    items: list[AlbumRead]
    total: int
    page: int
    page_size: int
    pages: int


# ── Service Times ─────────────────────────────────────────────────────────────
class ServiceTimeCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time | None = None
    service_name: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=250)
    description: str | None = None
    sort_order: int = 0
    is_active: bool = True


class ServiceTimeUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    service_name: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=250)
    description: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class ServiceTimeRead(CmsModel):
    id: UUID
    day_of_week: int
    start_time: time
    end_time: time | None
    service_name: str
    location: str | None
    description: str | None
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Page Content ──────────────────────────────────────────────────────────────
class PageContentUpdate(BaseModel):
    heading: str | None = Field(default=None, max_length=300)
    body: str | None = None
    image_url: str | None = Field(default=None, max_length=2048)
    status: PublicationStatus | None = None

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class PageContentRead(CmsModel):
    id: UUID
    page: str
    section: str
    heading: str | None
    body: str | None
    image_url: str | None
    status: PublicationStatus
    updated_at: datetime


# ── Site Settings ─────────────────────────────────────────────────────────────
class SettingUpsert(BaseModel):
    value: str = Field(max_length=2000)


class SettingRead(CmsModel):
    id: UUID
    key: str
    value: str
    is_public: bool
    updated_at: datetime


# ── CMS Dashboard ─────────────────────────────────────────────────────────────
class CmsDashboard(BaseModel):
    published_events: int
    draft_events: int
    active_announcements: int
    total_sermons: int
    gallery_albums: int
    service_times: int
