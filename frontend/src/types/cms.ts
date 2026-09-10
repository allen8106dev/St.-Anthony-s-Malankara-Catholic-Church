export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
export type ServiceTimeStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED'

export interface CmsDashboard {
  published_events: number
  draft_events: number
  active_announcements: number
  gallery_albums: number
  service_times: number
}

export interface CmsEvent {
  id: string
  title: string
  slug: string
  description: string | null
  start_datetime: string
  end_datetime: string | null
  location: string | null
  image_url: string | null
  details: Record<string, string> | null
  category: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface EventPayload {
  title: string
  description?: string | null
  start_datetime: string
  end_datetime?: string | null
  location?: string | null
  image_url?: string | null
  details?: Record<string, string> | null
  category?: string | null
  status?: EventStatus
}

export interface CmsAnnouncement {
  id: string
  title: string
  description: string | null
  image_url: string | null
  created_by_id: string
  expires_at: string | null
  status: PublicationStatus
  created_at: string
  updated_at: string
}

export interface AnnouncementPayload {
  title: string
  description?: string | null
  image_url?: string | null
  expires_at?: string | null
  status?: PublicationStatus
}

export interface GalleryImage {
  id: string
  image_url: string
  alt_text: string
  caption: string | null
  sort_order: number
}

export interface CmsAlbum {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  status: PublicationStatus
  images: GalleryImage[]
  created_at: string
  updated_at: string
}

export interface AlbumPayload {
  title: string
  description?: string | null
  cover_image_url?: string | null
  status?: PublicationStatus
}

export interface ImagePayload {
  image_url: string
  alt_text: string
  caption?: string | null
  sort_order?: number
}

export interface CmsServiceTime {
  id: string
  day_of_week: number
  start_time: string
  end_time: string | null
  service_name: string
  is_active: boolean
  status: ServiceTimeStatus
  created_at: string
  updated_at: string
}

export interface ServiceTimePayload {
  day_of_week: number
  start_time: string
  end_time?: string | null
  service_name: string
  status: ServiceTimeStatus
}

export interface HeroImage {
  id: string
  image_url: string
  alt_text: string
  sort_order: number
}

export interface HeroImagePayload {
  image_url: string
  alt_text: string
  sort_order?: number
}

export interface PageContent {
  id: string
  page: string
  section: string
  heading: string | null
  body: string | null
  image_url: string | null
  status: PublicationStatus
  updated_at: string
}

export interface PageContentPayload {
  heading?: string | null
  body?: string | null
  image_url?: string | null
  status?: PublicationStatus
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  is_public: boolean
  updated_at: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}
