import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type {
  AdminDashboard,
  FamilyCreatePayload, FamilyDetail, FamilyUpdatePayload,
  MemberCreatePayload, MemberDetail, MemberUpdatePayload,
  MembershipStatus, PaginatedFamilies, PaginatedMembers,
} from '../types/members'

// ── query keys ────────────────────────────────────────────────────────────────
export const memberKeys = {
  all: ['members'] as const,
  list: (params: object) => ['members', 'list', params] as const,
  detail: (id: string) => ['members', 'detail', id] as const,
}
export const familyKeys = {
  all: ['families'] as const,
  list: (params: object) => ['families', 'list', params] as const,
  detail: (id: string) => ['families', 'detail', id] as const,
}

// ── admin dashboard ───────────────────────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient.get<AdminDashboard>('/admin/dashboard').then(r => r.data),
    staleTime: 30_000,
  })
}

// ── members ───────────────────────────────────────────────────────────────────
export function useMembers(params: {
  page?: number; page_size?: number; search?: string
  status?: MembershipStatus | ''; family_id?: string
}) {
  return useQuery({
    queryKey: memberKeys.list(params),
    queryFn: async () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: params.page_size ?? 25 }
      if (params.search) p.search = params.search
      if (params.status) p.status = params.status
      if (params.family_id) p.family_id = params.family_id
      const { data } = await apiClient.get<PaginatedMembers>('/admin/members', { params: p })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: memberKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<MemberDetail>(`/admin/members/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MemberCreatePayload) =>
      apiClient.post<MemberDetail>('/admin/members', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.all }),
  })
}

export function useUpdateMember(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MemberUpdatePayload) =>
      apiClient.patch<MemberDetail>(`/admin/members/${id}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(memberKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: memberKeys.all })
    },
  })
}

// ── families ──────────────────────────────────────────────────────────────────
export function useFamilies(params: { page?: number; page_size?: number; search?: string }) {
  return useQuery({
    queryKey: familyKeys.list(params),
    queryFn: async () => {
      const p: Record<string, string | number> = { page: params.page ?? 1, page_size: params.page_size ?? 25 }
      if (params.search) p.search = params.search
      const { data } = await apiClient.get<PaginatedFamilies>('/admin/families', { params: p })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: familyKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<FamilyDetail>(`/admin/families/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateFamily() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FamilyCreatePayload) =>
      apiClient.post<FamilyDetail>('/admin/families', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: familyKeys.all }),
  })
}

export function useUpdateFamily(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FamilyUpdatePayload) =>
      apiClient.patch<FamilyDetail>(`/admin/families/${id}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(familyKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: familyKeys.all })
    },
  })
}
