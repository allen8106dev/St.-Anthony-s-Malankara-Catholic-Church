import { Link } from 'react-router-dom'
import { useFinanceSummary } from '../../../hooks/useFinance'
import { formatCurrency, PaymentMethodBadge, PaymentStatusBadge } from '../../../components/admin/FinanceBadge'
import { SkeletonRows } from '../../../components/admin/AdminShared'

export function FinanceOverviewPage() {
  const { data: summary, isLoading, isError } = useFinanceSummary()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Finance Overview</h1>
          <p>Church dues, collection summaries, and payment transactions</p>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/finance/dues/new" className="button button--primary">
            + Create Due
          </Link>
          <Link to="/admin/finance/payments/record" className="button button--outline">
            Record Payment
          </Link>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="finance-stat-grid">
        <div className="finance-stat-card">
          <span className="finance-stat-label">Total Outstanding</span>
          <span className="finance-stat-value text-accent">
            {isLoading ? '...' : formatCurrency(summary?.total_outstanding)}
          </span>
          <span className="finance-stat-sub">Across active unpaid dues</span>
        </div>

        <div className="finance-stat-card">
          <span className="finance-stat-label">Total Collected</span>
          <span className="finance-stat-value text-primary">
            {isLoading ? '...' : formatCurrency(summary?.total_collected)}
          </span>
          <span className="finance-stat-sub">Completed transactions</span>
        </div>

        <div className="finance-stat-card">
          <span className="finance-stat-label">Unpaid Dues</span>
          <span className="finance-stat-value">
            {isLoading ? '...' : summary?.count_unpaid ?? 0}
          </span>
          <span className="finance-stat-sub">Pending collection</span>
        </div>

        <div className="finance-stat-card">
          <span className="finance-stat-label">Partially Paid</span>
          <span className="finance-stat-value">
            {isLoading ? '...' : summary?.count_partially_paid ?? 0}
          </span>
          <span className="finance-stat-sub">Partial balance remaining</span>
        </div>

        <div className="finance-stat-card">
          <span className="finance-stat-label">Overdue Dues</span>
          <span className="finance-stat-value" style={{ color: '#a0332b' }}>
            {isLoading ? '...' : summary?.count_overdue ?? 0}
          </span>
          <span className="finance-stat-sub">Past due date</span>
        </div>
      </div>

      {/* Quick Links / Sections */}
      <div className="finance-section-links">
        <div className="finance-quick-card">
          <div>
            <h3>Dues Management</h3>
            <p>Assign and track membership, feast, and maintenance contributions.</p>
          </div>
          <div className="finance-quick-card__actions">
            <Link to="/admin/finance/dues" className="button button--outline">
              View All Dues →
            </Link>
          </div>
        </div>

        <div className="finance-quick-card">
          <div>
            <h3>Payments & Receipts</h3>
            <p>Review recorded transactions, search payment history, and void errors.</p>
          </div>
          <div className="finance-quick-card__actions">
            <Link to="/admin/finance/payments" className="button button--outline">
              View All Payments →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="admin-section" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Recent Payments</h2>
          <Link to="/admin/finance/payments" className="text-link" style={{ fontSize: '.85rem' }}>
            All payments →
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table" aria-label="Recent payments">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Payer / Family</th>
                <th scope="col">Associated Due</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Recorded By</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRows rows={4} />}
              {isError && (
                <tr>
                  <td colSpan={8}>
                    <p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>
                      Failed to load financial overview.
                    </p>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && summary?.recent_payments.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      <p style={{ fontWeight: 600 }}>No payments recorded yet.</p>
                      <p>Record a payment to start tracking collections.</p>
                    </div>
                  </td>
                </tr>
              )}
              {summary?.recent_payments.map((p) => (
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
                  <td>{p.due_title ?? 'General payment'}</td>
                  <td><strong>{formatCurrency(p.amount)}</strong></td>
                  <td><PaymentMethodBadge method={p.payment_method} /></td>
                  <td>{p.recorded_by_name ?? 'System'}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td>
                    <Link to={`/admin/finance/payments/${p.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
