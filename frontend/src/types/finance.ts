export type DueStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'OVERDUE' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'VOID' | 'FAILED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'ONLINE' | 'OTHER'

export interface DueListItem {
  id: string
  member_id: string | null
  member_name: string | null
  family_id: string | null
  family_name: string | null
  title: string
  due_type: string | null
  amount: string
  amount_paid: string
  outstanding: string
  due_date: string | null
  status: DueStatus
  created_at: string
}

export interface DueDetail {
  id: string
  member_id: string | null
  member_name: string | null
  family_id: string | null
  family_name: string | null
  title: string
  due_type: string | null
  description: string | null
  amount: string
  amount_paid: string
  outstanding: string
  due_date: string | null
  period_start: string | null
  period_end: string | null
  status: DueStatus
  created_at: string
  updated_at: string
  payments: PaymentListItem[]
}

export interface PaginatedDues {
  items: DueListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface DueCreatePayload {
  member_id?: string | null
  family_id?: string | null
  title: string
  due_type?: string | null
  description?: string | null
  amount: number | string
  due_date?: string | null
  period_start?: string | null
  period_end?: string | null
  status?: DueStatus
}

export interface DueUpdatePayload {
  title?: string
  due_type?: string | null
  description?: string | null
  amount?: number | string
  due_date?: string | null
  period_start?: string | null
  period_end?: string | null
  status?: DueStatus
}

export interface PaymentListItem {
  id: string
  member_id: string | null
  member_name: string | null
  family_name: string | null
  due_id: string | null
  due_title: string | null
  amount: string
  payment_date: string
  payment_method: PaymentMethod
  reference: string | null
  status: PaymentStatus
  recorded_by_id: string | null
  recorded_by_name: string | null
  created_at: string
}

export interface PaymentDetail {
  id: string
  member_id: string | null
  member_name: string | null
  family_name: string | null
  due_id: string | null
  due_title: string | null
  amount: string
  payment_date: string
  payment_method: PaymentMethod
  reference: string | null
  status: PaymentStatus
  notes: string | null
  recorded_by_id: string | null
  recorded_by_name: string | null
  created_at: string
}

export interface PaginatedPayments {
  items: PaymentListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface PaymentCreatePayload {
  member_id?: string | null
  due_id?: string | null
  amount: number | string
  payment_date: string
  payment_method: PaymentMethod
  reference?: string | null
  notes?: string | null
}

export interface FinanceSummary {
  total_outstanding: string
  total_collected: string
  count_unpaid: number
  count_partially_paid: number
  count_paid: number
  count_overdue: number
  recent_payments: PaymentListItem[]
}

