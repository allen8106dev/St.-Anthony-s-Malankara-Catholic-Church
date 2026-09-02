import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePayment, useVoidPayment } from '../../../hooks/useFinance'
import { formatCurrency, PaymentMethodBadge, PaymentStatusBadge } from '../../../components/admin/FinanceBadge'
import { ConfirmDialog } from '../../../components/admin/AdminShared'

export function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const { data: payment, isLoading, isError } = usePayment(paymentId)
  const voidPayment = useVoidPayment()

  const [showVoidDialog, setShowVoidDialog] = useState(false)

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

  if (isError || !payment) {
    return (
      <div className="admin-section">
        <h2>Payment Not Found</h2>
        <p>The requested payment record could not be found.</p>
        <Link to="/admin/finance/payments" className="button button--outline">
          ← Back to Payments
        </Link>
      </div>
    )
  }

  async function handleConfirmVoid() {
    if (!payment) return
    try {
      await voidPayment.mutateAsync(payment.id)
      setShowVoidDialog(false)
    } catch {
      // Error handled by query error
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
            <Link to="/admin/finance/payments" className="button button--ghost" style={{ fontSize: '.85rem' }}>
              ← Payments
            </Link>
            <PaymentStatusBadge status={payment.status} />
          </div>
          <h1>Payment Receipt: {formatCurrency(payment.amount)}</h1>
          <p>
            Recorded on{' '}
            {new Date(payment.payment_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          {payment.due_id && (
            <Link to={`/admin/finance/dues/${payment.due_id}`} className="button button--outline">
              View Associated Due
            </Link>
          )}
          {payment.status !== 'VOID' && (
            <button
              className="button button--ghost"
              style={{ color: '#a0332b' }}
              onClick={() => setShowVoidDialog(true)}
            >
              Void Payment
            </button>
          )}
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* Transaction Details */}
        <div className="admin-section">
          <h2>Payment Details</h2>
          <dl>
            <div className="admin-field">
              <dt>Amount Paid</dt>
              <dd>
                <strong style={{ fontSize: '1.4rem', color: '#1a6b3c' }}>{formatCurrency(payment.amount)}</strong>
              </dd>
            </div>

            <div className="admin-field">
              <dt>Payment Method</dt>
              <dd>
                <PaymentMethodBadge method={payment.payment_method} />
              </dd>
            </div>

            <div className="admin-field">
              <dt>Reference / Cheque / Txn ID</dt>
              <dd>
                {payment.reference ? <code>{payment.reference}</code> : 'No reference provided'}
              </dd>
            </div>

            <div className="admin-field">
              <dt>Status</dt>
              <dd>
                <PaymentStatusBadge status={payment.status} />
              </dd>
            </div>

            <div className="admin-field">
              <dt>Recorded By</dt>
              <dd>{payment.recorded_by_name ?? 'System Administrator'}</dd>
            </div>

            {payment.notes && (
              <div className="admin-field">
                <dt>Notes</dt>
                <dd style={{ whiteSpace: 'pre-wrap' }}>{payment.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Payer & Due Information */}
        <div className="admin-section">
          <h2>Payer & Allocation Information</h2>
          <dl>
            <div className="admin-field">
              <dt>Payer Member</dt>
              <dd>
                {payment.member_name ? (
                  <Link to={`/admin/members/${payment.member_id}`} className="text-link" style={{ fontWeight: 600 }}>
                    {payment.member_name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>

            {payment.family_name && (
              <div className="admin-field">
                <dt>Family Unit</dt>
                <dd>
                  <strong>{payment.family_name}</strong>
                </dd>
              </div>
            )}

            <div className="admin-field">
              <dt>Allocated To Due</dt>
              <dd>
                {payment.due_id ? (
                  <Link to={`/admin/finance/dues/${payment.due_id}`} className="text-link" style={{ fontWeight: 600 }}>
                    {payment.due_title ?? 'View Due Details'}
                  </Link>
                ) : (
                  'Unallocated (General Church Receipt)'
                )}
              </dd>
            </div>

            <div className="admin-field">
              <dt>Record Created</dt>
              <dd>{new Date(payment.created_at).toLocaleString('en-IN')}</dd>
            </div>
          </dl>
        </div>
      </div>

      {showVoidDialog && (
        <ConfirmDialog
          title="Void this Payment?"
          message="Voiding this payment will mark it as VOID and restore the outstanding balance on the associated due. This action is permanently recorded in the audit log."
          confirmLabel={voidPayment.isPending ? 'Voiding…' : 'Void Payment'}
          onConfirm={() => void handleConfirmVoid()}
          onCancel={() => setShowVoidDialog(false)}
        />
      )}
    </div>
  )
}
