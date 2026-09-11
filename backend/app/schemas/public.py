from datetime import date, datetime, time
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class PublicModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class PageMeta(PublicModel):
    offset: int
    limit: int
    total: int

class Paginated(BaseModel):
    items: list
    meta: PageMeta

class PublicEvent(PublicModel):
    id: UUID; slug: str; title: str; description: str | None; start_datetime: datetime; end_datetime: datetime | None; location: str | None; image_url: str | None; category: str | None
class PublicAnnouncement(PublicModel):
    id: UUID; title: str; description: str | None; image_url: str; expires_at: datetime | None
class PublicGalleryImage(PublicModel):
    id: UUID; image_url: str; alt_text: str; caption: str | None; sort_order: int
class PublicGalleryAlbum(PublicModel):
    id: UUID; title: str; description: str | None; cover_image_url: str | None; images: list[PublicGalleryImage] = []
class PublicHeroImage(PublicModel):
    id: UUID; image_url: str; alt_text: str; sort_order: int
class PublicContent(PublicModel):
    page: str; section: str; heading: str | None; body: str | None; image_url: str | None
class PublicSetting(PublicModel): key: str; value: str
class PublicServiceTime(PublicModel):
    id: UUID; day_of_week: int; start_time: time; end_time: time | None; service_name: str
class PublicLiturgyResource(PublicModel): id: UUID; title: str; description: str | None; pdf_url: str; sort_order: int
class PublicLiturgyCollection(PublicModel): id: UUID; title: str; description: str | None; sort_order: int; resources: list[PublicLiturgyResource] = []
