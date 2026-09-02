import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAdminAnnouncements, useAdminAnnouncement, useCreateAnnouncement, useUpdateAnnouncement, usePublishAnnouncement } from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, UnsavedBanner, FormSection, Field } from '../../../components/admin/CmsShared'
import { Pagination, SkeletonRows, ConfirmDialog } from '../../../components/admin/AdminShared'
import type { AnnouncementPayload, AnnouncementType } from '../../../types/cms'

const TYPES: { value: AnnouncementType; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'FUNERAL', label: 'Funeral' },
  { value: 'MARRIAGE', label: 'Marriage' },
  { value: 'OTHER', label: 'Other' },
]

function toDatetimeLocal(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AnnouncementsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''
  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError } = useAdminAnnouncements({ page, search, status })

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
        <div><h1>Announcements</h1><p>Manage parish notices</p></div>
        <Link to="/admin/content/announcements/new" className="button button--primary">+ New Announcement</Link>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input type="search" placeholder="Search announcements…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)} aria-label="Search announcements" />
        </div>
        <div className="admin-filter">
          <select value={status} onChange={e => setParams(p => { const n = new URLSearchParams(p); if (e.target.value) n.set('status', e.target.value); else n.delete('status'); n.set('page', '1'); return n })} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Announcements">
          <thead><tr>
            <th>Title</th><th>Type</th><th>Published</th><th>Expires</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && <tr><td colSpan={6}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load announcements.</p></td></tr>}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><p>No announcements found.</p></div></td></tr>
            )}
            {data?.items.map(ann => (
              <tr key={ann.id}>
                <td><strong>{ann.title}</strong></td>
                <td>{ann.type}</td>
                <td>{ann.published_at ? new Date(ann.published_at).toLocaleDateString() : '—'}</td>
                <td>{ann.expires_at ? new Date(ann.expires_at).toLocaleDateString() : '—'}</td>
                <td><CmsStatusBadge status={ann.status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/content/announcements/${ann.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
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

// ── Announcement Form ─────────────────────────────────────────────────────────
export function AnnouncementFormPage() {
  const { announcementId } = useParams<{ announcementId: string }>()
  const isEdit = !!announcementId
  const navigate = useNavigate()

  const { data: existing, isLoading } = useAdminAnnouncement(announcementId)
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement(announcementId ?? '')
  const publish = usePublishAnnouncement()

  const [form, setForm] = useState<AnnouncementPayload>({
    title: '', description: '', type: 'GENERAL', image_url: '',
    published_at: '', expires_at: '',
  })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | 'archive' | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? '',
        type: existing.type,
        image_url: existing.image_url ?? '',
        published_at: toDatetimeLocal(existing.published_at),
        expires_at: toDatetimeLocal(existing.expires_at),
      })
      setDirty(false)
    }
  }, [existing])

  function set(field: keyof AnnouncementPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload: AnnouncementPayload = {
        ...form,
        description: form.description || null,
        image_url: form.image_url || null,
        published_at: form.published_at ? new Date(form.published_at as string).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at as string).toISOString() : null,
      }
      if (isEdit) {
        await update.mutateAsync(payload)
      } else {
        const created = await create.mutateAsync(payload)
        navigate(`/admin/content/announcements/${created.id}/edit`, { replace: true })
      }
      setDirty(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Announcement' : 'New Announcement'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <Link to="/admin/content/announcements" className="button button--outline">← Back</Link>
      </div>

      <UnsavedBanner dirty={dirty} />

      <div className="cms-editor-layout">
        <form className="cms-form" onSubmit={handleSave}>
          <FormSection title="Announcement details">
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
            </Field>
            <Field label="Content">
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={5} />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <div className="admin-form-row">
              <Field label="Publish date" helper="When this announcement becomes visible.">
                <input type="datetime-local" value={form.published_at as string ?? ''} onChange={e => set('published_at', e.target.value)} />
              </Field>
              <Field label="Expiry date" helper="Leave blank to never expire.">
                <input type="datetime-local" value={form.expires_at as string ?? ''} onChange={e => set('expires_at', e.target.value)} />
              </Field>
            </div>
            <Field label="Image URL" helper="Optional image for this announcement.">
              <input type="url" value={form.image_url ?? ''} onChange={e => set('image_url', e.target.value)} maxLength={2048} />
            </Field>
            {form.image_url && (
              <img src={form.image_url as string} alt="Preview" className="cms-image-preview" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </FormSection>

          {error && <p className="admin-form-error" role="alert">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Saving…' : 'Save Draft'}
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
                loading={publish.isPending}
              />
            </div>
          </aside>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} announcement?`}
          message={confirmAction === 'publish' ? 'This will become visible to public visitors.' : confirmAction === 'unpublish' ? 'This will be hidden from public visitors.' : 'This will be archived.'}
          confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          onConfirm={() => void publish.mutateAsync({ id: announcementId!, action: confirmAction }).then(() => setConfirmAction(null))}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
