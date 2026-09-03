import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

interface PublicEvent {
  id: string; slug: string; title: string; description: string | null
  start_datetime: string; end_datetime: string | null; location: string | null
  image_url: string | null; category: string | null
}
export interface PublicAnnouncement {
  id: string; title: string; description: string | null; image_url: string | null; expires_at: string | null
}
interface PublicGalleryImage { id: string; image_url: string; alt_text: string; caption: string | null; sort_order: number }
interface PublicAlbum { id: string; title: string; description: string | null; cover_image_url: string | null; images: PublicGalleryImage[] }
interface PublicSermon {
  id: string; slug: string; title: string; speaker_name: string | null; date: string
  scripture_reference: string | null; description: string | null; video_url: string | null; thumbnail_url: string | null
}
interface PublicContent { page: string; section: string; heading: string | null; body: string | null; image_url: string | null }
interface PublicServiceTime { id: string; day_of_week: number; start_time: string; end_time: string | null; service_name: string; location: string | null; description: string | null; sort_order: number; is_active: boolean }
interface PublicSetting { key: string; value: string }
interface Paged<T> { items: T[]; meta: { offset: number; limit: number; total: number } }

export function usePublicEvents(params?: { timeframe?: 'upcoming' | 'past'; limit?: number }) {
  return useQuery({
    queryKey: ['public', 'events', params],
    queryFn: () => {
      const p: Record<string, string | number> = { limit: params?.limit ?? 20 }
      if (params?.timeframe) p.timeframe = params.timeframe
      return apiClient.get<Paged<PublicEvent>>('/public/events', { params: p }).then(r => r.data)
    },
    staleTime: 60_000,
  })
}

export function usePublicAnnouncements(limit = 10) {
  return useQuery({
    queryKey: ['public', 'announcements', limit],
    queryFn: () => apiClient.get<Paged<PublicAnnouncement>>('/public/announcements', { params: { limit } }).then(r => r.data),
    staleTime: 60_000,
  })
}

export function usePublicGallery(limit = 20) {
  return useQuery({
    queryKey: ['public', 'gallery', limit],
    queryFn: () => apiClient.get<Paged<PublicAlbum>>('/public/gallery', { params: { limit } }).then(r => r.data),
    staleTime: 120_000,
  })
}

export function usePublicAlbum(albumId: string | undefined) {
  return useQuery({
    queryKey: ['public', 'gallery', 'album', albumId],
    queryFn: () => apiClient.get<PublicAlbum>(`/public/gallery/${albumId}`).then(r => r.data),
    enabled: !!albumId,
    staleTime: 60_000,
  })
}

export function usePublicSermons(limit = 20) {
  return useQuery({
    queryKey: ['public', 'sermons', limit],
    queryFn: () => apiClient.get<Paged<PublicSermon>>('/public/sermons', { params: { limit } }).then(r => r.data),
    staleTime: 120_000,
  })
}

export function usePublicContent(page: string) {
  return useQuery({
    queryKey: ['public', 'content', page],
    queryFn: () => apiClient.get<PublicContent[]>('/public/content', { params: { page } }).then(r => r.data),
    staleTime: 120_000,
  })
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public', 'settings'],
    queryFn: () => apiClient.get<PublicSetting[]>('/public/settings').then(r => r.data),
    staleTime: 300_000,
  })
}

export function usePublicServiceTimes() {
  return useQuery({
    queryKey: ['public', 'service-times'],
    queryFn: () => apiClient.get<PublicServiceTime[]>('/public/service-times').then(r => r.data),
    staleTime: 300_000,
  })
}

export type { PublicEvent, PublicAlbum, PublicSermon, PublicContent, PublicSetting }
