import type { MembershipStatus } from '../../types/members'

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: 'Active', INACTIVE: 'Inactive', TRANSFERRED: 'Transferred',
  DECEASED: 'Deceased', OTHER: 'Other',
}
const STATUS_CLASS: Record<MembershipStatus, string> = {
  ACTIVE: 'status-active', INACTIVE: 'status-inactive', TRANSFERRED: 'status-transferred',
  DECEASED: 'status-deceased', OTHER: 'status-other',
}

export function StatusBadge({ status }: { status: MembershipStatus }) {
  return (
    <span className={`status-badge ${STATUS_CLASS[status]}`} aria-label={`Status: ${STATUS_LABELS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Pagination({
  page, pages, total, pageSize, onPage,
}: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)
  const pageNums = Array.from({ length: Math.min(pages, 7) }, (_, i) => {
    if (pages <= 7) return i + 1
    if (page <= 4) return i + 1
    if (page >= pages - 3) return pages - 6 + i
    return page - 3 + i
  })
  return (
    <div className="admin-pagination">
      <span>{total === 0 ? 'No results' : `${from}–${to} of ${total}`}</span>
      <div className="admin-pagination-controls" role="navigation" aria-label="Pagination">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
        {pageNums.map((p) => (
          <button key={p} onClick={() => onPage(p)} className={p === page ? 'active' : ''} aria-current={p === page ? 'page' : undefined}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">›</button>
      </div>
    </div>
  )
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}><td colSpan={6}><div className="admin-skeleton admin-skeleton-row" /></td></tr>
      ))}
    </>
  )
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', onConfirm, onCancel,
}: { title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-dialog__panel">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog__actions">
          <button className="button button--outline" onClick={onCancel}>Cancel</button>
          <button className="button button--primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
