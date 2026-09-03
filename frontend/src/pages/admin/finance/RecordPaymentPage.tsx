import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDue, useDues, useRecordPayment } from '../../../hooks/useFinance'
import { useMembers } from '../../../hooks/useMembers'
import { formatCurrency } from '../../../components/admin/FinanceBadge'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import type { PaymentMethod } from '../../../types/finance'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / Digital' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/IMPS)' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
]

export function RecordPaymentPage() {
  const [params] = useSearchParams()
  const dueIdParam = params.get('due_id') ?? ''
  const navigate = useNavigate()

  const [selectedDueId, setSelectedDueId] = useState(dueIdParam)
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: selectedDue, isLoading: isLoadingDue } = useDue(selectedDueId || undefined)
  const { data: unpaidDues } = useDues({ page_size: 100 })
  const { data: membersData } = useMembers({ page_size: 100 })
  const recordPayment = useRecordPayment(selectedDueId || undefined)

  useEffect(() => {
    if (dueIdParam) {
      setSelectedDueId(dueIdParam)
    }
  }, [dueIdParam])

  useEffect(() => {
    if (selectedDue) {
      // Pre-fill full remaining outstanding amount
      const remaining = parseFloat(selectedDue.outstanding)
      if (remaining > 0) {
        setAmount(remaining.toFixed(2))
      }
      if (selectedDue.member_id) {
        setMemberId(selectedDue.member_id)
      }
    }
  }, [selectedDue])

  const totalAmount = selectedDue ? parseFloat(selectedDue.amount) : null
  const alreadyPaid = selectedDue ? parseFloat(selectedDue.amount_paid) : null
  const numAmount = parseFloat(amount) || 0
  const outstandingBefore = selectedDue ? parseFloat(selectedDue.outstanding) : null
  const remainingBalanceAfter = outstandingBefore !== null ? Math.max(0, outstandingBefore - numAmount) : null

  function handleValidate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!amount || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.')
      return
    }

    if (outstandingBefore !== null && numAmount > outstandingBefore) {
      setError(
        `Payment amount (₹${numAmount.toFixed(2)}) exceeds the remaining outstanding balance of ₹${outstandingBefore.toFixed(2)}.`,
      )
      return
    }

    setShowConfirm(true)
  }

  async function handleConfirmedSubmit() {
    setError(null)
    try {
      const dateIso = new Date(paymentDate).toISOString()
      const created = await recordPayment.mutateAsync({
        due_id: selectedDueId || null,
        member_id: memberId || null,
        amount: numAmount.toFixed(2),
        payment_date: dateIso,
        payment_method: paymentMethod,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      })
      setShowConfirm(false)
      navigate(`/admin/finance/payments/${created.id}`)
    } catch (err: any) {
      setShowConfirm(false)
      setError(err.message ?? 'Failed to record payment.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link to="/admin/finance/payments" className="button button--ghost" style={{ fontSize: '.85rem', marginBottom: '.5rem' }}>
            ← Back to Payments
          </Link>
          <h1>Record Payment</h1>
          <p>Record a church due collection or general financial contribution</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Payment Form */}
        <div className="admin-section">
          {error && (
            <div className="admin-form-error" style={{ marginBottom: '1.25rem', padding: '.75rem', background: '#fdf2f2', border: '1px solid #f8d7da' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleValidate} className="admin-form">
            <label>
              Associated Due
              <select
                value={selectedDueId}
                onChange={(e) => setSelectedDueId(e.target.value)}
                disabled={!!dueIdParam}
              >
                <option value="">No specific due (General receipt)</option>
                {unpaidDues?.items
                  .filter((d) => d.status !== 'CANCELLED' && d.status !== 'PAID')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} — {d.member_name ?? d.family_name} (Outstanding: {formatCurrency(d.outstanding)})
                    </option>
                  ))}
              </select>
            </label>

            {!selectedDue?.member_id && (
              <label>
                Member (Payer)
                <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">Select a member (optional if family payment)…</option>
                  {membersData?.items.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} {m.family_name ? `(${m.family_name})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="admin-form-row">
              <label>
                Payment Amount (₹) *
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={outstandingBefore !== null ? outstandingBefore : undefined}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>

              <label>
                Payment Method *
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-form-row">
              <label>
                Payment Date *
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </label>

              <label>
                Reference / Receipt No.
                <input
                  type="text"
                  placeholder="e.g. UPI-1234, CHQ-5678"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
            </div>

            <label>
              Notes
              <textarea
                rows={2}
                placeholder="Optional notes or remarks regarding this transaction…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={recordPayment.isPending || (outstandingBefore !== null && outstandingBefore <= 0)}
              >
                Review & Record Payment
              </button>
              <Link to="/admin/finance/payments" className="button button--outline">
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Financial Preview Summary Panel */}
        <div className="admin-section" style={{ background: 'var(--surface-muted)' }}>
          <h2>Transaction Summary</h2>
          {isLoadingDue ? (
            <div className="admin-skeleton" style={{ height: '8rem' }} />
          ) : selectedDue ? (
            <dl>
              <div className="admin-field">
                <dt>Due Title</dt>
                <dd><strong>{selectedDue.title}</strong></dd>
              </div>
              <div className="admin-field">
                <dt>Payer / Recipient</dt>
                <dd>{selectedDue.member_name ?? (selectedDue.family_name ? `${selectedDue.family_name} (Family)` : '—')}</dd>
              </div>
              <div className="admin-field">
                <dt>Total Due Amount</dt>
                <dd>{formatCurrency(totalAmount)}</dd>
              </div>
              <div className="admin-field">
                <dt>Already Collected</dt>
                <dd>{formatCurrency(alreadyPaid)}</dd>
              </div>
              <div className="admin-field">
                <dt>Outstanding Before Payment</dt>
                <dd><strong>{formatCurrency(outstandingBefore)}</strong></dd>
              </div>
              <div className="admin-field" style={{ background: '#fff', padding: '.75rem' }}>
                <dt>Payment Being Recorded</dt>
                <dd style={{ fontSize: '1.2rem', color: '#1a6b3c', fontWeight: 700 }}>
                  + {formatCurrency(numAmount)}
                </dd>
              </div>
              <div className="admin-field" style={{ background: '#fff', padding: '.75rem' }}>
                <dt>Remaining Balance After</dt>
                <dd style={{ fontSize: '1.1rem', fontWeight: 700, color: remainingBalanceAfter && remainingBalanceAfter > 0 ? '#b76d42' : '#1a6b3c' }}>
                  {formatCurrency(remainingBalanceAfter)}
                </dd>
              </div>
            </dl>
          ) : (
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                No specific due selected. This will be recorded as a general church collection transaction.
              </p>
              <div className="admin-field" style={{ background: '#fff', padding: '.75rem', marginTop: '1rem' }}>
                <dt>Payment Being Recorded</dt>
                <dd style={{ fontSize: '1.2rem', color: '#1a6b3c', fontWeight: 700 }}>
                  {formatCurrency(numAmount)}
                </dd>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Payment Recording"
          message={`Are you sure you want to record this payment of ${formatCurrency(numAmount)} via ${paymentMethod}? This transaction will be logged in the audit trail.`}
          confirmLabel={recordPayment.isPending ? 'Recording…' : 'Confirm & Record'}
          onConfirm={() => void handleConfirmedSubmit()}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

