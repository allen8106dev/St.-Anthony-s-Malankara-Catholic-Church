import { Link } from 'react-router-dom'
import { useAdminDashboard } from '../../hooks/useMembers'
import { useAuth } from '../../auth/AuthContext'

function fmt(amount: string | number | undefined) {
  if (amount === undefined || amount === null) return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(n) ? '—' : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function MetricCard({ label, value, sub, to, accent }: { label: string; value: string | number; sub?: string; to?: string; accent?: boolean }) {
  const inner = (
    <div className="dash-metric">
      <span className="dash-metric__value" style={accent ? { color: 'var(--admin-accent)' } : undefined}>{value}</span>
      <span className="dash-metric__label">{label}</span>
      {sub && <span className="dash-metric__sub">{sub}</span>}
    </div>
  )
  return to ? <Link to={to} className="dash-metric-link">{inner}</Link> : inner
}

export function AdminDashboardPage() {
  const { currentUser } = useAuth()
  const { data, isLoading, isError } = useAdminDashboard()

  const canSeeFinance = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TREASURER' || currentUser?.role === 'MEMBER_ADMIN'
  const canSeeMembers = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MEMBER_ADMIN'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div>
          <p className="eyebrow dash-eyebrow">Overview</p>
          <h1 className="dash-title">Overview of your church&apos;s activity</h1>
          <p className="dash-subtitle">
            {greeting}{currentUser?.name ? `, ${currentUser.name}` : ''}. Keep an eye on parish operations, content updates, and financial activity.
          </p>
        </div>
      </header>

      {isError && <div className="dash-error" role="alert">Unable to load dashboard data. Please refresh the page.</div>}

      <section className="dash-metrics" aria-label="Dashboard summary">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="dash-metric"><div className="admin-skeleton" style={{ height: '5rem' }} /></div>)
        ) : data ? (
          <>
            {canSeeMembers && (
              <>
                <MetricCard label="Total Members" value={data.total_members} sub={`${data.active_members} active`} to="/admin/members" />
                <MetricCard label="Families" value={data.total_families} to="/admin/families" />
              </>
            )}
            <MetricCard label="Upcoming Events" value={data.upcoming_events} to="/admin/content/events" />
            <MetricCard label="Active Announcements" value={data.active_announcements} to="/admin/content/announcements" />
            {canSeeFinance && (
              <>
                <MetricCard label="Outstanding Dues" value={fmt(data.outstanding_dues)} sub={`${data.overdue_dues} overdue`} to="/admin/finance/dues" accent />
                <MetricCard label="Collected" value={fmt(data.total_collected)} to="/admin/finance/payments" />
              </>
            )}
          </>
        ) : null}
      </section>

      <div className="dash-body">
        <div className="dash-col-main">
          {canSeeFinance && (
            <section className="dash-section">
              <div className="dash-section-head">
                <h2>Recent Payments</h2>
                <Link to="/admin/finance/payments" className="text-link" style={{ fontSize: '.85rem' }}>View all →</Link>
              </div>
              {isLoading ? (
                <div className="admin-skeleton" style={{ height: '8rem' }} />
              ) : !data || data.recent_payments.length === 0 ? (
                <p className="dash-empty-inline">No payments recorded yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table" aria-label="Recent payments">
                    <thead>
                      <tr>
                        <th>Member / Family</th>
                        <th>Due</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.member_name ?? payment.family_name ?? '—'}</td>
                          <td style={{ color: 'var(--muted)', fontSize: '.88rem' }}>{payment.due_title ?? 'General'}</td>
                          <td><strong>{fmt(payment.amount)}</strong></td>
                          <td style={{ color: 'var(--muted)', fontSize: '.88rem' }}>{fmtDate(payment.payment_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="dash-col-side" style={!canSeeFinance ? { gridColumn: '1 / -1' } : undefined}>
          <section className="dash-section dash-section--muted">
            <h2>Online Donations</h2>
            <p className="dash-notice">
              Online donation processing is <strong>on hold</strong> and will be configured in a future phase. Manual payments can be recorded under Finance → Payments.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
