import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAdminEvents, useAdminEvent, useCreateEvent, useUpdateEvent, usePublishEvent } from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, UnsavedBanner, FormSection, Field } from '../../../components/admin/CmsShared'
import { ConfirmDialog, Pagination, SkeletonRows } from '../../../components/admin/AdminShared'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import type { EventPayload } from '../../../types/cms'

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
]

export function EventsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useAdminEvents({ page, search, status })

  useEffect(() => {
    const t = setTimeout(() => {
      setParams(p => {
        const n = new URLSearchParams(p)
        if (searchInput) n.set('search', searchInput); else n.delete('search')
        n.set('page', '1')
        return n
      })
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const setPage = useCallback((p: number) => setParams(prev => {
    const n = new URLSearchParams(prev); n.set('page', String(p)); return n
  }), [setParams])

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Events</h1><p>Manage parish events</p></div>
        <Link to="/admin/content/events/new" className="button button--primary">+ New Event</Link>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input type="search" placeholder="Search events…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)} aria-label="Search events" />
        </div>
        <div className="admin-filter">
          <select value={status} onChange={e => setParams(p => { const n = new URLSearchParams(p); if (e.target.value) n.set('status', e.target.value); else n.delete('status'); n.set('page', '1'); return n })} aria-label="Filter by status">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Events">
          <thead><tr>
            <th>Title</th><th>Date</th><th>Location</th><th>Category</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && <tr><td colSpan={6}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load events.</p></td></tr>}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><p>No events found.</p></div></td></tr>
            )}
            {data?.items.map(ev => (
              <tr key={ev.id}>
                <td><strong>{ev.title}</strong></td>
                <td>{new Date(ev.start_datetime).toLocaleDateString()}</td>
                <td>{ev.location ?? '—'}</td>
                <td>{ev.category ?? '—'}</td>
                <td><CmsStatusBadge status={ev.status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/content/events/${ev.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <Pagination page={data.page} pages={data.pages} total={data.total} pageSize={data.page_size} onPage={setPage} />
      )}
    </div>
  )
}

// ── Event Form ────────────────────────────────────────────────────────────────
function toLocalDatetime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventFormPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const isEdit = !!eventId
  const navigate = useNavigate()

  const { data: existing, isLoading } = useAdminEvent(eventId)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent(eventId ?? '')
  const publishEvent = usePublishEvent()

  const [form, setForm] = useState<EventPayload>({
    title: '', description: '', start_datetime: '', end_datetime: '',
    location: '', image_url: '', category: '', status: 'DRAFT',
  })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | 'archive' | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? '',
        start_datetime: toLocalDatetime(existing.start_datetime),
        end_datetime: existing.end_datetime ? toLocalDatetime(existing.end_datetime) : '',
        location: existing.location ?? '',
        image_url: existing.image_url ?? '',
        category: existing.category ?? '',
        status: existing.status,
      })
      setDirty(false)
    }
  }, [existing])

  function set(field: keyof EventPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload: EventPayload = {
        ...form,
        start_datetime: new Date(form.start_datetime).toISOString(),
        end_datetime: form.end_datetime ? new Date(form.end_datetime).toISOString() : null,
        description: form.description || null,
        location: form.location || null,
        image_url: form.image_url || null,
        category: form.category || null,
      }
      if (isEdit) {
        await updateEvent.mutateAsync(payload)
      } else {
        const created = await createEvent.mutateAsync(payload)
        navigate(`/admin/content/events/${created.id}/edit`, { replace: true })
      }
      setDirty(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save event.')
    }
  }

  async function handleStatusAction(action: 'publish' | 'unpublish' | 'archive') {
    if (!eventId) return
    await publishEvent.mutateAsync({ id: eventId, action })
    setConfirmAction(null)
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Event' : 'New Event'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <Link to="/admin/content/events" className="button button--outline">← Back</Link>
      </div>

      <UnsavedBanner dirty={dirty} />

      <div className="cms-editor-layout">
        <form className="cms-form" onSubmit={handleSave}>
          <FormSection title="Event details">
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
            </Field>
            <Field label="Description">
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={4} />
            </Field>
            <div className="admin-form-row">
              <Field label="Start date & time *">
                <input type="datetime-local" value={form.start_datetime} onChange={e => set('start_datetime', e.target.value)} required />
              </Field>
              <Field label="End date & time">
                <input type="datetime-local" value={form.end_datetime ?? ''} onChange={e => set('end_datetime', e.target.value)} />
              </Field>
            </div>
            <div className="admin-form-row">
              <Field label="Location">
                <input value={form.location ?? ''} onChange={e => set('location', e.target.value)} maxLength={250} />
              </Field>
              <Field label="Category">
                <input value={form.category ?? ''} onChange={e => set('category', e.target.value)} maxLength={100} />
              </Field>
            </div>
            <ImageUploader
              value={form.image_url ?? ''}
              onChange={val => set('image_url', val)}
              label="Event Image"
              helper="Upload a JPG, PNG, WebP, or GIF image (max 5 MB)."
            />
          </FormSection>

          {error && <p className="admin-form-error" role="alert">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={createEvent.isPending || updateEvent.isPending}>
              {createEvent.isPending || updateEvent.isPending ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </form>

        {isEdit && existing && (
          <aside className="cms-sidebar">
            <div className="cms-sidebar-section">
              <h3>Publishing</h3>
              <p className="cms-sidebar-status">Status: <CmsStatusBadge status={existing.status} /></p>
              <PublishActions
                status={existing.status}
                onPublish={() => setConfirmAction('publish')}
                onUnpublish={() => setConfirmAction('unpublish')}
                onArchive={() => setConfirmAction('archive')}
                loading={publishEvent.isPending}
              />
            </div>
          </aside>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} event?`}
          message={
            confirmAction === 'publish'
              ? 'This event will become visible to public visitors.'
              : confirmAction === 'unpublish'
              ? 'This event will be hidden from public visitors.'
              : 'This event will be archived and hidden from public visitors.'
          }
          confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          onConfirm={() => void handleStatusAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
