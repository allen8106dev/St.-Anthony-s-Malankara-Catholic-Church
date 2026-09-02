import type { DueStatus, PaymentMethod, PaymentStatus } from '../../types/finance'

const DUE_STATUS_LABELS: Record<DueStatus, string> = {
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  WAIVED: 'Waived',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

const DUE_STATUS_CLASS: Record<DueStatus, string> = {
  PENDING: 'status-pending',
  PARTIALLY_PAID: 'status-partial',
  PAID: 'status-paid',
  WAIVED: 'status-waived',
  OVERDUE: 'status-overdue',
  CANCELLED: 'status-cancelled',
}

export function DueStatusBadge({ status }: { status: DueStatus }) {
  return (
    <span
      className={`status-badge finance-badge ${DUE_STATUS_CLASS[status] ?? 'status-pending'}`}
      aria-label={`Due status: ${DUE_STATUS_LABELS[status] ?? status}`}
    >
      {DUE_STATUS_LABELS[status] ?? status}
    </span>
  )
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  VOID: 'Voided',
  FAILED: 'Failed',
}

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  PENDING: 'status-pending',
  COMPLETED: 'status-paid',
  VOID: 'status-cancelled',
  FAILED: 'status-overdue',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`status-badge finance-badge ${PAYMENT_STATUS_CLASS[status] ?? 'status-pending'}`}
      aria-label={`Payment status: ${PAYMENT_STATUS_LABELS[status] ?? status}`}
    >
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
  OTHER: 'Other',
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className="payment-method-badge" aria-label={`Payment method: ${METHOD_LABELS[method] ?? method}`}>
      {METHOD_LABELS[method] ?? method}
    </span>
  )
}

export function formatCurrency(amount: string | number | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '₹0.00'
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

