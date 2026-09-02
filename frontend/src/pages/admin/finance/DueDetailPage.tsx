import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCancelDue, useDue } from '../../../hooks/useFinance'
import { DueStatusBadge, formatCurrency, PaymentMethodBadge, PaymentStatusBadge } from '../../../components/admin/FinanceBadge'
import { ConfirmDialog } from '../../../components/admin/AdminShared'

export function DueDetailPage() {
  const { dueId } = useParams<{ dueId: string }>()
  const { data: due, isLoading, isError } = useDue(dueId)
  const cancelDue = useCancelDue(dueId ?? '')

  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (isLoading) {
    return (
      <div>
        <div className="admin-skeleton" style={{ height: '2.5rem', width: '16rem', marginBottom: '1.5rem' }} />
        <div className="admin-detail-grid">
          <div className="admin-skeleton" style={{ height: '16rem' }} />
          <div className="admin-skeleton" style={{ height: '16rem' }} />
        </div>
      </div>
    )
  }

  if (isError || !due) {
    return (
      <div className="admin-section">
        <h2>Due Not Found</h2>
        <p>The requested church due record could not be found.</p>
        <Link to="/admin/finance/dues" className="button button--outline">
          ← Back to Dues
        </Link>
      </div>
    )
  }

  async function handleConfirmCancel() {
    try {
      await cancelDue.mutateAsync()
      setShowCancelDialog(false)
    } catch {
      // Error handled by query client / notification
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
            <Link to="/admin/finance/dues" className="button button--ghost" style={{ fontSize: '.85rem' }}>
              ← Dues
            </Link>
            <DueStatusBadge status={due.status} />
          </div>
          <h1>{due.title}</h1>
          {due.due_type && (
            <p style={{ textTransform: 'capitalize' }}>Type: {due.due_type.replace(/_/g, ' ')}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          {due.status !== 'PAID' && due.status !== 'CANCELLED' && (
            <Link to={`/admin/finance/payments/record?due_id=${due.id}`} className="button button--primary">
              Record Payment
            </Link>
          )}
          {due.status !== 'CANCELLED' && (
            <Link to={`/admin/finance/dues/${due.id}/edit`} className="button button--outline">
              Edit Due
            </Link>
          )}
          {due.status !== 'CANCELLED' && due.status !== 'PAID' && (
            <button
              className="button button--ghost"
              style={{ color: '#a0332b' }}
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Due
            </button>
          )}
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* Recipient & Period Details */}
        <div className="admin-section">
          <h2>Due Information</h2>
          <dl>
            <div className="admin-field">
              <dt>Recipient</dt>
              <dd>
                {due.member_name ? (
                  <Link to={`/admin/members/${due.member_id}`} className="text-link" style={{ fontWeight: 600 }}>
                    {due.member_name}
                  </Link>
                ) : due.family_name ? (
                  <Link to={`/admin/families/${due.family_id}`} className="text-link" style={{ fontWeight: 600 }}>
                    {due.family_name} (Family)
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            {due.family_name && due.member_name && (
              <div className="admin-field">
                <dt>Family</dt>
                <dd>
                  <Link to={`/admin/families/${due.family_id}`} className="text-link">
                    {due.family_name}
                  </Link>
                </dd>
              </div>
            )}

            <div className="admin-field">
              <dt>Due Date</dt>
              <dd>
                {due.due_date
                  ? new Date(due.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'No due date set'}
              </dd>
            </div>

            {(due.period_start || due.period_end) && (
              <div className="admin-field">
                <dt>Period Covered</dt>
                <dd>
                  {due.period_start ?? '—'} to {due.period_end ?? '—'}
                </dd>
              </div>
            )}

            {due.description && (
              <div className="admin-field">
                <dt>Description / Notes</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{due.description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Financial Breakdown */}
        <div className="admin-section">
          <h2>Financial Balance</h2>
          <dl>
            <div className="admin-field">
              <dt>Total Amount</dt>
              <dd>
                <strong style={{ fontSize: '1.25rem' }}>{formatCurrency(due.amount)}</strong>
              </dd>
            </div>

            <div className="admin-field">
              <dt>Amount Collected</dt>
              <dd>
                <span style={{ color: '#1a6b3c', fontWeight: 600 }}>{formatCurrency(due.amount_paid)}</span>
              </dd>
            </div>

            <div className="admin-field">
              <dt>Outstanding Balance</dt>
              <dd>
                <span style={{ color: parseFloat(due.outstanding) > 0 ? '#b76d42' : 'inherit', fontWeight: 700, fontSize: '1.1rem' }}>
                  {formatCurrency(due.outstanding)}
                </span>
              </dd>
            </div>

            <div className="admin-field">
              <dt>Current Status</dt>
              <dd>
                <DueStatusBadge status={due.status} />
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Payment History */}
      <div className="admin-section" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Payment History ({due.payments?.length ?? 0})</h2>
          {due.status !== 'PAID' && due.status !== 'CANCELLED' && (
            <Link to={`/admin/finance/payments/record?due_id=${due.id}`} className="button button--outline" style={{ fontSize: '.85rem' }}>
              + Record Payment
            </Link>
          )}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table" aria-label="Payment history for this due">
            <thead>
              <tr>
                <th scope="col">Payment Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Reference</th>
                <th scope="col">Recorded By</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {due.payments?.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty" style={{ padding: '2rem' }}>
                      <p>No payments recorded for this due yet.</p>
                    </div>
                  </td>
                </tr>
              )}
              {due.payments?.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><strong>{formatCurrency(p.amount)}</strong></td>
                  <td><PaymentMethodBadge method={p.payment_method} /></td>
                  <td>{p.reference ?? '—'}</td>
                  <td>{p.recorded_by_name ?? 'Admin'}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td>
                    <Link to={`/admin/finance/payments/${p.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCancelDialog && (
        <ConfirmDialog
          title="Cancel this Due?"
          message="Cancelling this due will mark it as CANCELLED and prevent any future payments from being recorded against it. This action will be audited."
          confirmLabel="Cancel Due"
          onConfirm={() => void handleConfirmCancel()}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}
    </div>
  )
}
