export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
export type AnnouncementType = 'GENERAL' | 'IMPORTANT' | 'COMMUNITY' | 'FUNERAL' | 'MARRIAGE' | 'OTHER'

export interface CmsDashboard {
  published_events: number
  draft_events: number
  active_announcements: number
  total_sermons: number
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
  category?: string | null
  status?: EventStatus
}

export interface CmsAnnouncement {
  id: string
  title: string
  slug: string
  description: string | null
  type: AnnouncementType
  image_url: string | null
  published_at: string | null
  expires_at: string | null
  status: PublicationStatus
  created_at: string
  updated_at: string
}

export interface AnnouncementPayload {
  title: string
  description?: string | null
  type?: AnnouncementType
  image_url?: string | null
  published_at?: string | null
  expires_at?: string | null
  status?: PublicationStatus
}

export interface SermonSeries {
  id: string
  title: string
  description: string | null
}

export interface CmsSermon {
  id: string
  title: string
  slug: string
  speaker_name: string | null
  date: string
  scripture_reference: string | null
  description: string | null
  video_url: string | null
  thumbnail_url: string | null
  series_id: string | null
  series: SermonSeries | null
  status: PublicationStatus
  created_at: string
  updated_at: string
}

export interface SermonPayload {
  title: string
  speaker_name?: string | null
  date: string
  scripture_reference?: string | null
  description?: string | null
  video_url?: string | null
  thumbnail_url?: string | null
  series_id?: string | null
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
  location: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceTimePayload {
  day_of_week: number
  start_time: string
  end_time?: string | null
  service_name: string
  location?: string | null
  description?: string | null
  sort_order?: number
  is_active?: boolean
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
