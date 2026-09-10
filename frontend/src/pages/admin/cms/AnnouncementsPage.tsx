import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAdminAnnouncements, useAdminAnnouncement, useCreateAnnouncement, useUpdateAnnouncement, usePublishAnnouncement } from '../../../hooks/useCms'
import { CmsStatusBadge, UnsavedBanner, Field } from '../../../components/admin/CmsShared'
import { Pagination, SkeletonRows, ConfirmDialog } from '../../../components/admin/AdminShared'
import type { AnnouncementPayload } from '../../../types/cms'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import { LoadingState } from '../../../components/ui/Feedback'

export function AnnouncementsPage() {
  const navigate = useNavigate()
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

  const openAnnouncement = (id: string) => navigate(`/admin/content/announcements/${id}`)

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
            <th>Announcement</th><th>Expires</th><th>Status</th>
          </tr></thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && <tr><td colSpan={3}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load announcements.</p></td></tr>}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={3}><div className="admin-empty"><p>No announcements found.</p></div></td></tr>
            )}
            {data?.items.map(ann => (
              <tr
                key={ann.id}
                className="admin-table-row--clickable"
                onClick={() => openAnnouncement(ann.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openAnnouncement(ann.id)
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Open ${ann.title}`}
              >
                <td>
                  <div className="announcement-admin-item">{ann.image_url && <img src={ann.image_url} alt="" />}</div>
                  <strong>{ann.title}</strong>
                </td>
                <td>{ann.expires_at ? new Date(ann.expires_at).toLocaleDateString() : '—'}</td>
                <td><CmsStatusBadge status={ann.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card-grid">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="member-card"><div className="admin-skeleton" style={{ height: '5rem' }} /></div>
        ))}
        {isError && <p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load announcements.</p>}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="admin-empty"><p>No announcements found.</p></div>
        )}
        {data?.items.map(ann => (
          <button
            key={ann.id}
            type="button"
            className="member-card announcement-admin-card"
            onClick={() => openAnnouncement(ann.id)}
          >
            <div className="announcement-admin-card__row">
              {ann.image_url && <div className="announcement-admin-item"><img src={ann.image_url} alt="" /></div>}
              <div className="member-card__name">{ann.title}</div>
            </div>
            <div className="member-card__meta">
              {ann.expires_at ? `Expires ${new Date(ann.expires_at).toLocaleDateString()}` : 'No expiry'}
            </div>
            <CmsStatusBadge status={ann.status} />
          </button>
        ))}
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

  const [form, setForm] = useState<AnnouncementPayload>({ title: '', description: '', image_url: '', expires_at: null })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description ?? '',
        image_url: existing.image_url ?? '',
        expires_at: existing.expires_at,
      })
      setDirty(false)
    }
  }, [existing])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function set(field: keyof AnnouncementPayload, value: string | null) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function saveAnnouncement() {
    setError('')
    if (!form.title.trim()) { setError('Title is required.'); return null }
    try {
      const payload: AnnouncementPayload = {
        ...form,
        description: form.description || null,
        image_url: form.image_url || null,
      }
      if (isEdit) {
        await update.mutateAsync(payload)
      } else {
        const created = await create.mutateAsync(payload)
        navigate(`/admin/content/announcements/${created.id}`, { replace: true })
        setDirty(false)
        return created.id
      }
      setDirty(false)
      return announcementId
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
      return null
    }
  }

  async function handlePublish() {
    const id = await saveAnnouncement()
    if (id) { await publish.mutateAsync({ id, action: 'publish' }); setDirty(false) }
  }

  async function handleUnpublish() {
    if (!announcementId) return
    await publish.mutateAsync({ id: announcementId, action: 'unpublish' })
  }

  if (isLoading) return <LoadingState text="Loading announcement…" />

  const status = existing?.status ?? 'DRAFT'
  const isPublished = status === 'PUBLISHED'
  const busy = create.isPending || update.isPending || publish.isPending
  const leave = () => { if (!dirty || window.confirm('Leave without saving?\n\nYour changes will be lost.')) navigate('/admin/content/announcements') }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Announcement' : 'New Announcement'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <div className="announcement-header-actions">
          {isPublished ? (
            <button
              type="button"
              className="button button--primary"
              disabled={busy || !dirty}
              onClick={() => void saveAnnouncement()}
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </button>
          ) : (
            dirty && (
              <button
                type="button"
                className="button button--outline"
                disabled={busy}
                onClick={() => void saveAnnouncement()}
              >
                {create.isPending || update.isPending ? 'Saving…' : 'Save Draft'}
              </button>
            )
          )}
          {!isPublished && (
            <button
              type="button"
              className="button button--primary"
              disabled={busy}
              onClick={() => setConfirmAction('publish')}
            >
              Publish
            </button>
          )}
          {isPublished && (
            <button
              type="button"
              className="button button--outline"
              disabled={busy}
              onClick={() => setConfirmAction('unpublish')}
            >
              Unpublish
            </button>
          )}
          <button type="button" className="button button--ghost" onClick={leave}>← Back</button>
        </div>
      </div>

      <UnsavedBanner dirty={dirty} />

      <form className="announcement-editor" onSubmit={e => { e.preventDefault(); if (dirty) void saveAnnouncement() }}>
        <div className="announcement-editor__fields">
          <Field label="Title *">
            <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
          </Field>
          <Field label="Description">
            <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={8} maxLength={600} />
            <span className="cms-character-count">{(form.description ?? '').length}/600</span>
          </Field>
          <Field label="Expiry date & time" helper="After this time, the announcement will no longer appear publicly.">
            <input type="datetime-local" value={form.expires_at ? form.expires_at.slice(0, 16) : ''} onChange={e => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </Field>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
        </div>

        <div className="announcement-editor__image">
          <ImageUploader
            value={form.image_url ?? ''}
            onChange={value => set('image_url', value)}
            label="Image"
          />
        </div>
      </form>

      {confirmAction && (
        <ConfirmDialog
          title={`${confirmAction === 'publish' ? 'Publish' : 'Unpublish'} announcement?`}
          message={confirmAction === 'publish' ? 'This will become visible to public visitors.' : 'This will be hidden from public visitors.'}
          confirmLabel={confirmAction === 'publish' ? 'Publish' : 'Unpublish'}
          onConfirm={() => {
            const action = confirmAction
            setConfirmAction(null)
            if (action === 'publish') void handlePublish()
            else void handleUnpublish()
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
