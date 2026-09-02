import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type {
  AlbumPayload, AnnouncementPayload, CmsAlbum, CmsAnnouncement, CmsDashboard,
  CmsEvent, CmsSermon, CmsServiceTime, EventPayload, GalleryImage, ImagePayload,
  PageContent, PageContentPayload, Paginated, SermonPayload, SermonSeries,
  ServiceTimePayload, SiteSetting,
} from '../types/cms'

const BASE = '/admin/cms'

export const cmsKeys = {
  dashboard: ['cms', 'dashboard'] as const,
  events: (p: object) => ['cms', 'events', p] as const,
  event: (id: string) => ['cms', 'event', id] as const,
  announcements: (p: object) => ['cms', 'announcements', p] as const,
  announcement: (id: string) => ['cms', 'announcement', id] as const,
  sermonSeries: ['cms', 'sermon-series'] as const,
  sermons: (p: object) => ['cms', 'sermons', p] as const,
  sermon: (id: string) => ['cms', 'sermon', id] as const,
  albums: (p: object) => ['cms', 'albums', p] as const,
  album: (id: string) => ['cms', 'album', id] as const,
  serviceTimes: ['cms', 'service-times'] as const,
  pageContent: (page: string) => ['cms', 'content', page] as const,
  settings: ['cms', 'settings'] as const,
  publicEvents: ['public', 'events'] as const,
  publicAnnouncements: ['public', 'announcements'] as const,
  publicSermons: ['public', 'sermons'] as const,
  publicGallery: ['public', 'gallery'] as const,
  publicServiceTimes: ['public', 'service-times'] as const,
  publicContent: (page: string) => ['public', 'content', page] as const,
  publicSettings: ['public', 'settings'] as const,
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useCmsDashboard() {
  return useQuery({
    queryKey: cmsKeys.dashboard,
    queryFn: () => apiClient.get<CmsDashboard>(`${BASE}/dashboard`).then(r => r.data),
  })
}

// ── Events ────────────────────────────────────────────────────────────────────
export function useAdminEvents(params: { page?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: cmsKeys.events(params),
    queryFn: () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: 25 }
      if (params.search) p.search = params.search
      if (params.status) p.status = params.status
      return apiClient.get<Paginated<CmsEvent>>(`${BASE}/events`, { params: p }).then(r => r.data)
    },
    placeholderData: prev => prev,
  })
}

export function useAdminEvent(id: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.event(id ?? ''),
    queryFn: () => apiClient.get<CmsEvent>(`${BASE}/events/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EventPayload) => apiClient.post<CmsEvent>(`${BASE}/events`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms', 'events'] }),
  })
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<EventPayload>) => apiClient.patch<CmsEvent>(`${BASE}/events/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.event(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'events'] })
    },
  })
}

export function usePublishEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' | 'archive' }) =>
      apiClient.post<CmsEvent>(`${BASE}/events/${id}/${action}`).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.event(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'events'] })
      qc.invalidateQueries({ queryKey: cmsKeys.publicEvents })
    },
  })
}

// ── Announcements ─────────────────────────────────────────────────────────────
export function useAdminAnnouncements(params: { page?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: cmsKeys.announcements(params),
    queryFn: () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: 25 }
      if (params.search) p.search = params.search
      if (params.status) p.status = params.status
      return apiClient.get<Paginated<CmsAnnouncement>>(`${BASE}/announcements`, { params: p }).then(r => r.data)
    },
    placeholderData: prev => prev,
  })
}

export function useAdminAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.announcement(id ?? ''),
    queryFn: () => apiClient.get<CmsAnnouncement>(`${BASE}/announcements/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AnnouncementPayload) => apiClient.post<CmsAnnouncement>(`${BASE}/announcements`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms', 'announcements'] }),
  })
}

export function useUpdateAnnouncement(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AnnouncementPayload>) => apiClient.patch<CmsAnnouncement>(`${BASE}/announcements/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.announcement(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'announcements'] })
    },
  })
}

export function usePublishAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' | 'archive' }) =>
      apiClient.post<CmsAnnouncement>(`${BASE}/announcements/${id}/${action}`).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.announcement(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'announcements'] })
      qc.invalidateQueries({ queryKey: cmsKeys.publicAnnouncements })
    },
  })
}

// ── Sermon Series ─────────────────────────────────────────────────────────────
export function useSermonSeries() {
  return useQuery({
    queryKey: cmsKeys.sermonSeries,
    queryFn: () => apiClient.get<SermonSeries[]>(`${BASE}/sermon-series`).then(r => r.data),
  })
}

export function useCreateSermonSeries() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      apiClient.post<SermonSeries>(`${BASE}/sermon-series`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsKeys.sermonSeries }),
  })
}

// ── Sermons ───────────────────────────────────────────────────────────────────
export function useAdminSermons(params: { page?: number; search?: string; status?: string; series_id?: string }) {
  return useQuery({
    queryKey: cmsKeys.sermons(params),
    queryFn: () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: 25 }
      if (params.search) p.search = params.search
      if (params.status) p.status = params.status
      if (params.series_id) p.series_id = params.series_id
      return apiClient.get<Paginated<CmsSermon>>(`${BASE}/sermons`, { params: p }).then(r => r.data)
    },
    placeholderData: prev => prev,
  })
}

export function useAdminSermon(id: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.sermon(id ?? ''),
    queryFn: () => apiClient.get<CmsSermon>(`${BASE}/sermons/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateSermon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SermonPayload) => apiClient.post<CmsSermon>(`${BASE}/sermons`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms', 'sermons'] }),
  })
}

export function useUpdateSermon(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SermonPayload>) => apiClient.patch<CmsSermon>(`${BASE}/sermons/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.sermon(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'sermons'] })
    },
  })
}

export function usePublishSermon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' | 'archive' }) =>
      apiClient.post<CmsSermon>(`${BASE}/sermons/${id}/${action}`).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.sermon(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'sermons'] })
      qc.invalidateQueries({ queryKey: cmsKeys.publicSermons })
    },
  })
}

// ── Gallery ───────────────────────────────────────────────────────────────────
export function useAdminAlbums(params: { page?: number; status?: string }) {
  return useQuery({
    queryKey: cmsKeys.albums(params),
    queryFn: () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: 25 }
      if (params.status) p.status = params.status
      return apiClient.get<Paginated<CmsAlbum>>(`${BASE}/gallery`, { params: p }).then(r => r.data)
    },
    placeholderData: prev => prev,
  })
}

export function useAdminAlbum(id: string | undefined) {
  return useQuery({
    queryKey: cmsKeys.album(id ?? ''),
    queryFn: () => apiClient.get<CmsAlbum>(`${BASE}/gallery/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useCreateAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AlbumPayload) => apiClient.post<CmsAlbum>(`${BASE}/gallery`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms', 'albums'] }),
  })
}

export function useUpdateAlbum(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AlbumPayload>) => apiClient.patch<CmsAlbum>(`${BASE}/gallery/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.album(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'albums'] })
    },
  })
}

export function usePublishAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' | 'archive' }) =>
      apiClient.post<CmsAlbum>(`${BASE}/gallery/${id}/${action}`).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: cmsKeys.album(id) })
      qc.invalidateQueries({ queryKey: ['cms', 'albums'] })
      qc.invalidateQueries({ queryKey: cmsKeys.publicGallery })
    },
  })
}

export function useAddImage(albumId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ImagePayload) => apiClient.post<GalleryImage>(`${BASE}/gallery/${albumId}/images`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cmsKeys.album(albumId) }),
  })
}

export function useRemoveImage(albumId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => apiClient.delete(`${BASE}/gallery/${albumId}/images/${imageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.album(albumId) })
      qc.invalidateQueries({ queryKey: cmsKeys.publicGallery })
    },
  })
}

// ── Service Times ─────────────────────────────────────────────────────────────
export function useAdminServiceTimes() {
  return useQuery({
    queryKey: cmsKeys.serviceTimes,
    queryFn: () => apiClient.get<CmsServiceTime[]>(`${BASE}/service-times`).then(r => r.data),
  })
}

export function useCreateServiceTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ServiceTimePayload) => apiClient.post<CmsServiceTime>(`${BASE}/service-times`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.serviceTimes })
      qc.invalidateQueries({ queryKey: cmsKeys.publicServiceTimes })
    },
  })
}

export function useUpdateServiceTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ServiceTimePayload> }) =>
      apiClient.patch<CmsServiceTime>(`${BASE}/service-times/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.serviceTimes })
      qc.invalidateQueries({ queryKey: cmsKeys.publicServiceTimes })
    },
  })
}

export function useDeleteServiceTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${BASE}/service-times/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.serviceTimes })
      qc.invalidateQueries({ queryKey: cmsKeys.publicServiceTimes })
    },
  })
}

// ── Page Content ──────────────────────────────────────────────────────────────
export function useAdminPageContent(page: string) {
  return useQuery({
    queryKey: cmsKeys.pageContent(page),
    queryFn: () => apiClient.get<PageContent[]>(`${BASE}/content/${page}`).then(r => r.data),
  })
}

export function useUpsertPageContent(page: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: PageContentPayload }) =>
      apiClient.put<PageContent>(`${BASE}/content/${page}/${section}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.pageContent(page) })
      qc.invalidateQueries({ queryKey: cmsKeys.publicContent(page) })
    },
  })
}

// ── Site Settings ─────────────────────────────────────────────────────────────
export function useAdminSettings() {
  return useQuery({
    queryKey: cmsKeys.settings,
    queryFn: () => apiClient.get<SiteSetting[]>(`${BASE}/settings`).then(r => r.data),
  })
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiClient.put<SiteSetting>(`${BASE}/settings/${key}`, { value }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cmsKeys.settings })
      qc.invalidateQueries({ queryKey: cmsKeys.publicSettings })
    },
  })
}
