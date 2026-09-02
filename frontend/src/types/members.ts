export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'DECEASED' | 'OTHER'
export type RelationshipType = 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING' | 'GUARDIAN' | 'OTHER'

export interface AdminDashboard {
  total_members: number
  active_members: number
  total_families: number
  outstanding_dues: string
  total_collected: string
  overdue_dues: number
  upcoming_events: number
  active_announcements: number
  recent_payments: RecentPayment[]
  donations_on_hold: boolean
}

export interface RecentPayment {
  id: string
  member_name: string | null
  family_name: string | null
  due_title: string | null
  amount: string
  payment_date: string
  payment_method: string
}

export interface MemberListItem {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  membership_status: MembershipStatus
  phone: string | null
  email: string | null
  family_id: string | null
  family_name: string | null
}

export interface MemberDetail {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  photo_url: string | null
  membership_status: MembershipStatus
  date_joined: string | null
  notes: string | null
  family_id: string | null
  family_name: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedMembers {
  items: MemberListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface FamilyListItem {
  id: string
  family_name: string
  address: string | null
  member_count: number
}

export interface FamilyDetail {
  id: string
  family_name: string
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  members: MemberListItem[]
}

export interface PaginatedFamilies {
  items: FamilyListItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface MemberCreatePayload {
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth?: string
  phone?: string
  email?: string
  address?: string
  membership_status?: MembershipStatus
  date_joined?: string
  notes?: string
  family_id?: string
}

export interface MemberUpdatePayload extends Partial<MemberCreatePayload> {}

export interface FamilyCreatePayload {
  family_name: string
  address?: string
  notes?: string
}

export interface FamilyUpdatePayload extends Partial<FamilyCreatePayload> {}
