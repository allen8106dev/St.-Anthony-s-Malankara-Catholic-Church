import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMembers, useFamilies } from '../../hooks/useMembers'
import { Pagination, SkeletonRows, StatusBadge } from '../../components/admin/AdminShared'
import type { MembershipStatus } from '../../types/members'

const STATUSES: { value: MembershipStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TRANSFERRED', label: 'Transferred' },
  { value: 'DECEASED', label: 'Deceased' },
  { value: 'OTHER', label: 'Other' },
]

export function MembersPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const status = (params.get('status') ?? '') as MembershipStatus | ''
  const familyId = params.get('family_id') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useMembers({ page, page_size: 25, search, status, family_id: familyId })
  const { data: familiesData } = useFamilies({ page_size: 100 })

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => {
        const n = new URLSearchParams(p)
        if (searchInput) n.set('search', searchInput); else n.delete('search')
        n.set('page', '1')
        return n
      })
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const setPage = useCallback((p: number) => setParams((prev) => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n }), [setParams])

  function setFilter(key: string, value: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set(key, value); else n.delete(key); n.set('page', '1'); return n })
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Members</h1>
          <p>Manage church families and members</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/families" className="button button--outline">Families</Link>
          <Link to="/admin/members/new" className="button button--primary">+ Add Member</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="search" placeholder="Search by name, email, phone…"
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search members"
          />
        </div>
        <div className="admin-filter">
          <select value={status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="admin-filter">
          <select value={familyId} onChange={(e) => setFilter('family_id', e.target.value)} aria-label="Filter by family">
            <option value="">All families</option>
            {familiesData?.items.map((f) => <option key={f.id} value={f.id}>{f.family_name}</option>)}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Members">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Family</th>
              <th scope="col">Phone</th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && (
              <tr><td colSpan={6}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load members. Please try again.</p></td></tr>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={6}>
                <div className="admin-empty">
                  <p style={{ fontWeight: 600 }}>No members found.</p>
                  <p>Try changing your search or filters.</p>
                </div>
              </td></tr>
            )}
            {data?.items.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member-list-name">{m.first_name} {m.last_name}</div>
                </td>
                <td><span className="member-list-family">{m.family_name ?? '—'}</span></td>
                <td>{m.phone ?? '—'}</td>
                <td>{m.email ?? '—'}</td>
                <td><StatusBadge status={m.membership_status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/members/${m.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>View</Link>
                    <Link to={`/admin/members/${m.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="member-card-grid">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="member-card"><div className="admin-skeleton" style={{ height: '5rem' }} /></div>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <div className="admin-empty"><p style={{ fontWeight: 600 }}>No members found.</p><p>Try changing your search or filters.</p></div>
        )}
        {data?.items.map((m) => (
          <div key={m.id} className="member-card">
            <div className="member-card__name">{m.first_name} {m.last_name}</div>
            {m.family_name && <div className="member-card__meta">{m.family_name}</div>}
            {m.phone && <div className="member-card__meta">{m.phone}</div>}
            {m.email && <div className="member-card__meta">{m.email}</div>}
            <StatusBadge status={m.membership_status} />
            <div className="member-card__actions">
              <Link to={`/admin/members/${m.id}`} className="button button--outline" style={{ fontSize: '.82rem' }}>View</Link>
              <Link to={`/admin/members/${m.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
            </div>
          </div>
        ))}
      </div>

      {data && data.pages > 1 && (
        <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.page_size} onPage={setPage} />
      )}
    </div>
  )
}
