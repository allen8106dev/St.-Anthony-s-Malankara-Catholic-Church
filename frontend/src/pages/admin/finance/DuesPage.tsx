import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDues } from '../../../hooks/useFinance'
import { useFamilies, useMembers } from '../../../hooks/useMembers'
import { Pagination, SkeletonRows } from '../../../components/admin/AdminShared'
import { DueStatusBadge, formatCurrency } from '../../../components/admin/FinanceBadge'
import type { DueStatus } from '../../../types/finance'

const DUE_STATUSES: { value: DueStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'WAIVED', label: 'Waived' },
]

export function DuesPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const status = (params.get('status') ?? '') as DueStatus | ''
  const dueType = params.get('due_type') ?? ''
  const memberId = params.get('member_id') ?? ''
  const familyId = params.get('family_id') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useDues({
    page,
    page_size: 25,
    search,
    status,
    due_type: dueType,
    member_id: memberId,
    family_id: familyId,
  })

  const { data: familiesData } = useFamilies({ page_size: 100 })
  const { data: membersData } = useMembers({ page_size: 100 })

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => {
        const n = new URLSearchParams(p)
        if (searchInput) n.set('search', searchInput)
        else n.delete('search')
        n.set('page', '1')
        return n
      })
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput, setParams])

  const setPage = useCallback(
    (p: number) =>
      setParams((prev) => {
        const n = new URLSearchParams(prev)
        n.set('page', String(p))
        return n
      }),
    [setParams],
  )

  function setFilter(key: string, value: string) {
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (value) n.set(key, value)
      else n.delete(key)
      n.set('page', '1')
      return n
    })
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Church Dues</h1>
          <p>Track membership dues, special contributions, and outstanding balances</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/finance/dues/new" className="button button--primary">
            + Create Due
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="search"
            placeholder="Search by title, member, or family…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search dues"
          />
        </div>

        <div className="admin-filter">
          <select value={status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
            {DUE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter">
          <select value={familyId} onChange={(e) => setFilter('family_id', e.target.value)} aria-label="Filter by family">
            <option value="">All families</option>
            {familiesData?.items.map((f) => (
              <option key={f.id} value={f.id}>
                {f.family_name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter">
          <select value={memberId} onChange={(e) => setFilter('member_id', e.target.value)} aria-label="Filter by member">
            <option value="">All members</option>
            {membersData?.items.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Church dues">
          <thead>
            <tr>
              <th scope="col">Title / Type</th>
              <th scope="col">Recipient</th>
              <th scope="col">Amount</th>
              <th scope="col">Paid</th>
              <th scope="col">Outstanding</th>
              <th scope="col">Due Date</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && (
              <tr>
                <td colSpan={8}>
                  <p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>
                    Failed to load dues. Please try again.
                  </p>
                </td>
              </tr>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="admin-empty">
                    <p style={{ fontWeight: 600 }}>No dues found.</p>
                    <p>Try changing your search filters or create a new due.</p>
                  </div>
                </td>
              </tr>
            )}
            {data?.items.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.title}</strong>
                  {d.due_type && (
                    <span className="member-list-family" style={{ display: 'block', textTransform: 'capitalize' }}>
                      {d.due_type.replace(/_/g, ' ')}
                    </span>
                  )}
                </td>
                <td>
                  {d.member_name ? (
                    <div>
                      <span>{d.member_name}</span>
                      {d.family_name && <small className="member-list-family" style={{ display: 'block' }}>{d.family_name}</small>}
                    </div>
                  ) : d.family_name ? (
                    <span>{d.family_name} (Family)</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td><strong>{formatCurrency(d.amount)}</strong></td>
                <td>{formatCurrency(d.amount_paid)}</td>
                <td>
                  <strong style={{ color: parseFloat(d.outstanding) > 0 ? '#b76d42' : 'inherit' }}>
                    {formatCurrency(d.outstanding)}
                  </strong>
                </td>
                <td>{d.due_date ? new Date(d.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                <td><DueStatusBadge status={d.status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/finance/dues/${d.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>
                      View
                    </Link>
                    {d.status !== 'PAID' && d.status !== 'CANCELLED' && (
                      <Link to={`/admin/finance/payments/record?due_id=${d.id}`} className="button button--primary" style={{ fontSize: '.78rem', padding: '.3rem .6rem', minHeight: 'auto' }}>
                        Pay
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="member-card-grid">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="member-card">
              <div className="admin-skeleton" style={{ height: '5rem' }} />
            </div>
          ))}
        {!isLoading && data?.items.length === 0 && (
          <div className="admin-empty">
            <p style={{ fontWeight: 600 }}>No dues found.</p>
            <p>Try changing your search filters or create a new due.</p>
          </div>
        )}
        {data?.items.map((d) => (
          <div key={d.id} className="member-card">
            <div className="member-card__name">{d.title}</div>
            <div className="member-card__meta">
              Recipient: {d.member_name ?? (d.family_name ? `${d.family_name} (Family)` : '—')}
            </div>
            <div className="member-card__meta">
              Amount: <strong>{formatCurrency(d.amount)}</strong> | Paid: {formatCurrency(d.amount_paid)}
            </div>
            <div className="member-card__meta">
              Outstanding: <strong>{formatCurrency(d.outstanding)}</strong>
            </div>
            {d.due_date && <div className="member-card__meta">Due: {d.due_date}</div>}
            <DueStatusBadge status={d.status} />
            <div className="member-card__actions">
              <Link to={`/admin/finance/dues/${d.id}`} className="button button--outline" style={{ fontSize: '.82rem' }}>
                View
              </Link>
              {d.status !== 'PAID' && d.status !== 'CANCELLED' && (
                <Link to={`/admin/finance/payments/record?due_id=${d.id}`} className="button button--primary" style={{ fontSize: '.82rem' }}>
                  Pay
                </Link>
              )}
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

