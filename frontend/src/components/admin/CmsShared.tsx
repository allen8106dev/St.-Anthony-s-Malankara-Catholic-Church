import type { EventStatus, PublicationStatus } from '../../types/cms'

type AnyStatus = PublicationStatus | EventStatus

const STATUS_LABEL: Record<AnyStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
}

const STATUS_CLASS: Record<AnyStatus, string> = {
  DRAFT: 'cms-status--draft',
  PUBLISHED: 'cms-status--published',
  ARCHIVED: 'cms-status--archived',
  CANCELLED: 'cms-status--archived',
  COMPLETED: 'cms-status--published',
}

export function CmsStatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span className={`cms-status-badge ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function PublishActions({
  status,
  onPublish,
  onUnpublish,
  onArchive,
  loading,
}: {
  status: AnyStatus
  onPublish: () => void
  onUnpublish: () => void
  onArchive: () => void
  loading?: boolean
}) {
  return (
    <div className="cms-publish-actions">
      {status !== 'PUBLISHED' && (
        <button className="button button--primary" onClick={onPublish} disabled={loading}>
          Publish
        </button>
      )}
      {status === 'PUBLISHED' && (
        <button className="button button--outline" onClick={onUnpublish} disabled={loading}>
          Unpublish
        </button>
      )}
      {status !== 'ARCHIVED' && status !== 'CANCELLED' && (
        <button className="button button--ghost cms-archive-btn" onClick={onArchive} disabled={loading}>
          Archive
        </button>
      )}
    </div>
  )
}

export function UnsavedBanner({ dirty }: { dirty: boolean }) {
  if (!dirty) return null
  return <div className="cms-unsaved-banner" role="status">You have unsaved changes.</div>
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cms-form-section">
      <h2 className="cms-form-section__title">{title}</h2>
      {children}
    </div>
  )
}

export function Field({
  label, helper, error, children,
}: { label: string; helper?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="cms-field">
      <span className="cms-field__label">{label}</span>
      {helper && <span className="cms-field__helper">{helper}</span>}
      {children}
      {error && <span className="cms-field__error">{error}</span>}
    </label>
  )
}
