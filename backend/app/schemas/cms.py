"""CMS admin schemas — never exposed through public routes."""
from datetime import date as Date, datetime, time
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.models.domain import EventStatus, PublicationStatus, ServiceTimeStatus


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
    description: str | None = Field(default=None, max_length=600)
    image_url: str | None = Field(default=None, max_length=2048)
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
    description: str | None = Field(default=None, max_length=600)
    image_url: str | None = Field(default=None, max_length=2048)
    expires_at: datetime | None = None

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class AnnouncementRead(CmsModel):
    id: UUID
    title: str
    description: str | None
    image_url: str | None
    created_by_id: UUID
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
    status: ServiceTimeStatus = ServiceTimeStatus.ACTIVE
    is_active: bool | None = None

    @model_validator(mode="after")
    def sync_status(self):
        if self.is_active is not None and "status" not in self.model_fields_set:
            self.status = ServiceTimeStatus.ACTIVE if self.is_active else ServiceTimeStatus.INACTIVE
        self.is_active = self.status == ServiceTimeStatus.ACTIVE
        return self


class ServiceTimeUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    start_time: time | None = None
    end_time: time | None = None
    service_name: str | None = Field(default=None, min_length=1, max_length=200)
    status: ServiceTimeStatus | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def sync_status(self):
        if "status" in self.model_fields_set and self.status is not None:
            self.is_active = self.status == ServiceTimeStatus.ACTIVE
        elif "is_active" in self.model_fields_set and self.is_active is not None:
            self.status = ServiceTimeStatus.ACTIVE if self.is_active else ServiceTimeStatus.INACTIVE
        return self


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
    status: ServiceTimeStatus
    created_at: datetime
    updated_at: datetime


# ── Hero Images ───────────────────────────────────────────────────────────────
class HeroImageCreate(BaseModel):
    image_url: str = Field(max_length=2048)
    alt_text: str = Field(min_length=1, max_length=500)
    sort_order: int = 0

    @field_validator("image_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("image_url must be an absolute URL")
        return v


class HeroImageUpdate(BaseModel):
    alt_text: str | None = Field(default=None, min_length=1, max_length=500)
    sort_order: int | None = None


class HeroImageRead(CmsModel):
    id: UUID
    image_url: str
    alt_text: str
    sort_order: int
    created_at: datetime


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
    gallery_albums: int
    service_times: int
