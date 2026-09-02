import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type {
  DueCreatePayload,
  DueDetail,
  DueListItem,
  DueStatus,
  DueUpdatePayload,
  FinanceSummary,
  PaginatedDues,
  PaginatedPayments,
  PaymentCreatePayload,
  PaymentDetail,
  PaymentMethod,
  PaymentStatus,
} from '../types/finance'

export const financeKeys = {
  all: ['finance'] as const,
  summary: () => ['finance', 'summary'] as const,
  dues: ['finance', 'dues'] as const,
  duesList: (params: object) => ['finance', 'dues', 'list', params] as const,
  dueDetail: (id: string) => ['finance', 'dues', 'detail', id] as const,
  payments: ['finance', 'payments'] as const,
  paymentsList: (params: object) => ['finance', 'payments', 'list', params] as const,
  paymentDetail: (id: string) => ['finance', 'payments', 'detail', id] as const,
}

// ── Finance Summary ──────────────────────────────────────────────────────────
export function useFinanceSummary() {
  return useQuery({
    queryKey: financeKeys.summary(),
    queryFn: async () => {
      const { data } = await apiClient.get<FinanceSummary>('/admin/finance/summary')
      return data
    },
  })
}

// ── Dues ─────────────────────────────────────────────────────────────────────
export function useDues(params: {
  page?: number
  page_size?: number
  search?: string
  status?: DueStatus | ''
  due_type?: string
  member_id?: string
  family_id?: string
  is_overdue?: boolean
}) {
  return useQuery({
    queryKey: financeKeys.duesList(params),
    queryFn: async () => {
      const p: Record<string, string | number | boolean> = {
        page: params.page ?? 1,
        page_size: params.page_size ?? 25,
      }
      if (params.search) p.search = params.search
      if (params.status) p.status = params.status
      if (params.due_type) p.due_type = params.due_type
      if (params.member_id) p.member_id = params.member_id
      if (params.family_id) p.family_id = params.family_id
      if (params.is_overdue !== undefined) p.is_overdue = params.is_overdue

      const { data } = await apiClient.get<PaginatedDues>('/admin/dues', { params: p })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function useDue(id: string | undefined) {
  return useQuery({
    queryKey: financeKeys.dueDetail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<DueDetail>(`/admin/dues/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateDue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DueCreatePayload) =>
      apiClient.post<DueListItem>('/admin/dues', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.dues })
      qc.invalidateQueries({ queryKey: financeKeys.summary() })
    },
  })
}

export function useUpdateDue(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DueUpdatePayload) =>
      apiClient.patch<DueDetail>(`/admin/dues/${id}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(financeKeys.dueDetail(id), data)
      qc.invalidateQueries({ queryKey: financeKeys.dues })
      qc.invalidateQueries({ queryKey: financeKeys.summary() })
    },
  })
}

export function useCancelDue(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post<DueDetail>(`/admin/dues/${id}/cancel`).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(financeKeys.dueDetail(id), data)
      qc.invalidateQueries({ queryKey: financeKeys.dues })
      qc.invalidateQueries({ queryKey: financeKeys.summary() })
    },
  })
}

// ── Payments ─────────────────────────────────────────────────────────────────
export function usePayments(params: {
  page?: number
  page_size?: number
  member_id?: string
  family_id?: string
  due_id?: string
  payment_method?: PaymentMethod | ''
  status?: PaymentStatus | ''
  search?: string
}) {
  return useQuery({
    queryKey: financeKeys.paymentsList(params),
    queryFn: async () => {
      const p: Record<string, string | number> = {
        page: params.page ?? 1,
        page_size: params.page_size ?? 25,
      }
      if (params.member_id) p.member_id = params.member_id
      if (params.family_id) p.family_id = params.family_id
      if (params.due_id) p.due_id = params.due_id
      if (params.payment_method) p.payment_method = params.payment_method
      if (params.status) p.status = params.status
      if (params.search) p.search = params.search

      const { data } = await apiClient.get<PaginatedPayments>('/admin/payments', { params: p })
      return data
    },
    placeholderData: (prev) => prev,
  })
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: financeKeys.paymentDetail(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<PaymentDetail>(`/admin/payments/${id}`)
      return data
    },
    enabled: !!id,
  })
}

export function useRecordPayment(dueId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) => {
      const url = dueId ? `/admin/dues/${dueId}/payments` : '/admin/payments'
      return apiClient.post<PaymentDetail>(url, payload).then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
    },
  })
}

export function useVoidPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) =>
      apiClient.post<PaymentDetail>(`/admin/payments/${paymentId}/void`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
    },
  })
}

