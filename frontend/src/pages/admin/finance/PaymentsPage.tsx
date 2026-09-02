import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePayments } from '../../../hooks/useFinance'
import { Pagination, SkeletonRows } from '../../../components/admin/AdminShared'
import { formatCurrency, PaymentMethodBadge, PaymentStatusBadge } from '../../../components/admin/FinanceBadge'
import type { PaymentMethod, PaymentStatus } from '../../../types/finance'

const PAYMENT_METHODS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '', label: 'All methods' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
]

const PAYMENT_STATUSES: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'VOID', label: 'Voided' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
]

export function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const paymentMethod = (params.get('payment_method') ?? '') as PaymentMethod | ''
  const status = (params.get('status') ?? '') as PaymentStatus | ''

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = usePayments({
    page,
    page_size: 25,
    search,
    payment_method: paymentMethod,
    status,
  })

  // Debounce search
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
          <h1>Payments & Receipts</h1>
          <p>Recorded collections, payment receipts, and transaction history</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/finance/payments/record" className="button button--primary">
            + Record Payment
          </Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="search"
            placeholder="Search by payer, due, reference no…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search payments"
          />
        </div>

        <div className="admin-filter">
          <select
            value={paymentMethod}
            onChange={(e) => setFilter('payment_method', e.target.value)}
            aria-label="Filter by payment method"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter">
          <select
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by payment status"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Payments list">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Payer / Family</th>
              <th scope="col">Associated Due</th>
              <th scope="col">Amount</th>
              <th scope="col">Method</th>
              <th scope="col">Reference</th>
              <th scope="col">Recorded By</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && (
              <tr>
                <td colSpan={9}>
                  <p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>
                    Failed to load payments. Please try again.
                  </p>
                </td>
              </tr>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="admin-empty">
                    <p style={{ fontWeight: 600 }}>No payment records found.</p>
                    <p>Try changing your search filters or record a new payment.</p>
                  </div>
                </td>
              </tr>
            )}
            {data?.items.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>
                  <strong>{p.member_name ?? p.family_name ?? '—'}</strong>
                  {p.family_name && p.member_name && (
                    <span className="member-list-family" style={{ display: 'block' }}>
                      {p.family_name}
                    </span>
                  )}
                </td>
                <td>
                  {p.due_id ? (
                    <Link to={`/admin/finance/dues/${p.due_id}`} className="text-link">
                      {p.due_title ?? 'View Due'}
                    </Link>
                  ) : (
                    'General payment'
                  )}
                </td>
                <td><strong style={{ fontSize: '1rem' }}>{formatCurrency(p.amount)}</strong></td>
                <td><PaymentMethodBadge method={p.payment_method} /></td>
                <td>{p.reference ? <code>{p.reference}</code> : '—'}</td>
                <td>{p.recorded_by_name ?? 'System'}</td>
                <td><PaymentStatusBadge status={p.status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/finance/payments/${p.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>
                      Details
                    </Link>
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
            <p style={{ fontWeight: 600 }}>No payments found.</p>
          </div>
        )}
        {data?.items.map((p) => (
          <div key={p.id} className="member-card">
            <div className="member-card__name">{formatCurrency(p.amount)}</div>
            <div className="member-card__meta">
              Payer: {p.member_name ?? p.family_name ?? '—'}
            </div>
            {p.due_title && <div className="member-card__meta">Due: {p.due_title}</div>}
            <div className="member-card__meta">
              Date: {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.25rem' }}>
              <PaymentMethodBadge method={p.payment_method} />
              <PaymentStatusBadge status={p.status} />
            </div>
            <div className="member-card__actions">
              <Link to={`/admin/finance/payments/${p.id}`} className="button button--outline" style={{ fontSize: '.82rem' }}>
                View Details
              </Link>
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

