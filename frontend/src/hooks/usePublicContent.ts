import { queryOptions, useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'

const publicRequest = { timeout: 12_000 }

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
export interface PublicLiturgyCollection { id: string; title: string; description: string | null; sort_order: number; resources: { id: string; title: string; description: string | null; pdf_url: string; sort_order: number }[] }
export interface PublicHeroImage { id: string; image_url: string; alt_text: string; sort_order: number }
interface PublicContent { page: string; section: string; heading: string | null; body: string | null; image_url: string | null }
interface PublicServiceTime { id: string; day_of_week: number; start_time: string; end_time: string | null; service_name: string }
interface PublicSetting { key: string; value: string }
interface Paged<T> { items: T[]; meta: { offset: number; limit: number; total: number } }

export const publicQueries = {
  events: (params?: { timeframe?: 'upcoming' | 'past'; limit?: number }) => queryOptions({
    queryKey: ['public', 'events', params],
    queryFn: () => {
      const p: Record<string, string | number> = { limit: params?.limit ?? 20 }
      if (params?.timeframe) p.timeframe = params.timeframe
      return apiClient.get<Paged<PublicEvent>>('/public/events', { ...publicRequest, params: p }).then(r => r.data)
    },
    staleTime: 60_000,
  }),

  announcements: (limit = 10) => queryOptions({
    queryKey: ['public', 'announcements', limit],
    queryFn: () => apiClient.get<Paged<PublicAnnouncement>>('/public/announcements', { ...publicRequest, params: { limit } }).then(r => r.data),
    staleTime: 60_000,
  }),

  gallery: (limit = 20) => queryOptions({
    queryKey: ['public', 'gallery', limit],
    queryFn: () => apiClient.get<Paged<PublicAlbum>>('/public/gallery', { ...publicRequest, params: { limit } }).then(r => r.data),
    staleTime: 120_000,
  }),
  liturgy: () => queryOptions({ queryKey: ['public', 'liturgy'], staleTime: 120_000, queryFn: () => apiClient.get<PublicLiturgyCollection[]>('/public/liturgy', publicRequest).then(r => r.data) }),

  album: (albumId: string | undefined) => queryOptions({
    queryKey: ['public', 'gallery', 'album', albumId],
    queryFn: () => apiClient.get<PublicAlbum>(`/public/gallery/${albumId}`, publicRequest).then(r => r.data),
    enabled: !!albumId,
    staleTime: 60_000,
  }),

  heroImages: () => queryOptions({
    queryKey: ['public', 'hero-images'],
    queryFn: () => apiClient.get<PublicHeroImage[]>('/public/hero-images', publicRequest).then(r => r.data),
    staleTime: 120_000,
  }),

  content: (page: string) => queryOptions({
    queryKey: ['public', 'content', page],
    queryFn: () => apiClient.get<PublicContent[]>('/public/content', { ...publicRequest, params: { page } }).then(r => r.data),
    staleTime: 120_000,
  }),

  settings: () => queryOptions({
    queryKey: ['public', 'settings'],
    queryFn: () => apiClient.get<PublicSetting[]>('/public/settings', publicRequest).then(r => r.data),
    staleTime: 300_000,
  }),

  serviceTimes: () => queryOptions({
    queryKey: ['public', 'service-times'],
    queryFn: () => apiClient.get<PublicServiceTime[]>('/public/service-times', publicRequest).then(r => r.data),
    staleTime: 300_000,
  }),
}

export function usePublicEvents(params?: { timeframe?: 'upcoming' | 'past'; limit?: number }) { return useQuery(publicQueries.events(params)) }
export function usePublicAnnouncements(limit = 10) { return useQuery(publicQueries.announcements(limit)) }
export function usePublicGallery(limit = 20) { return useQuery(publicQueries.gallery(limit)) }
export function usePublicLiturgy() { return useQuery(publicQueries.liturgy()) }
export function usePublicAlbum(albumId: string | undefined) { return useQuery(publicQueries.album(albumId)) }
export function usePublicHeroImages() { return useQuery(publicQueries.heroImages()) }
export function usePublicContent(page: string) { return useQuery(publicQueries.content(page)) }
export function usePublicSettings() { return useQuery(publicQueries.settings()) }
export function usePublicServiceTimes() { return useQuery(publicQueries.serviceTimes()) }

export type { PublicEvent, PublicAlbum, PublicContent, PublicSetting }
