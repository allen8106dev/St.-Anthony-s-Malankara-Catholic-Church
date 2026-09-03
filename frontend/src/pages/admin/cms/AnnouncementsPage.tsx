import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAdminAnnouncements, useAdminAnnouncement, useCreateAnnouncement, useUpdateAnnouncement, usePublishAnnouncement } from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, UnsavedBanner, FormSection, Field } from '../../../components/admin/CmsShared'
import { Pagination, SkeletonRows, ConfirmDialog } from '../../../components/admin/AdminShared'
import type { AnnouncementPayload } from '../../../types/cms'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import { AnnouncementVisual } from '../../../components/public/AnnouncementVisual'

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
            <th>Announcement</th><th>Expires</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && <tr><td colSpan={4}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load announcements.</p></td></tr>}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><p>No announcements found.</p></div></td></tr>
            )}
            {data?.items.map(ann => (
              <tr key={ann.id}>
                <td><div className="announcement-admin-item">{ann.image_url && <img src={ann.image_url} alt="" />}</div><strong>{ann.title}</strong></td>
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

  const [form, setForm] = useState<AnnouncementPayload>({ title: '', description: '', image_url: '', expires_at: null })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [crop, setCrop] = useState({ scale: 100, position: 50 })
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | 'archive' | null>(null)

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
        navigate(`/admin/content/announcements/${created.id}/edit`, { replace: true })
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

  async function handleSave(e: React.FormEvent) { e.preventDefault(); await saveAnnouncement() }
  async function handlePublish() {
    const id = await saveAnnouncement()
    if (id) { await publish.mutateAsync({ id, action: 'publish' }); setDirty(false) }
  }

  if (isLoading) return <p role="status">Loading…</p>

  const previewItem = { id: announcementId ?? 'preview', title: form.title || 'Your announcement title', description: form.description || null, image_url: form.image_url || null, expires_at: form.expires_at ?? null }
  const leave = () => { if (!dirty || window.confirm('Leave without saving?\n\nYour changes will be lost.')) navigate('/admin/content/announcements') }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Announcement' : 'New Announcement'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <button type="button" className="button button--outline" onClick={leave}>← Back</button>
      </div>

      <UnsavedBanner dirty={dirty} />

      <div className="cms-editor-layout">
        <form className="cms-form" onSubmit={handleSave}>
          <FormSection title="Announcement details">
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
            </Field>
            <Field label="Description">
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={4} maxLength={600} />
              <span className="cms-character-count">{(form.description ?? '').length}/600</span>
            </Field>
            <ImageUploader value={form.image_url ?? ''} onChange={value => set('image_url', value)} onCropChange={setCrop} />
            <Field label="Expiry date & time" helper="After this time, the announcement will no longer appear publicly.">
              <input type="datetime-local" value={form.expires_at ? form.expires_at.slice(0, 16) : ''} onChange={e => set('expires_at', e.target.value ? new Date(e.target.value).toISOString() : null)} />
            </Field>
          </FormSection>

          {error && <p className="admin-form-error" role="alert">{error}</p>}

          <div className="admin-form-actions announcement-actions">
            <button type="submit" className="button button--primary" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" className="button button--primary" disabled={publish.isPending || create.isPending || update.isPending} onClick={() => void handlePublish()}>Publish</button>
          </div>
        </form>

        <aside id="announcement-preview" className="cms-preview-panel"><p className="eyebrow">Published appearance</p><AnnouncementVisual item={previewItem} preview imageScale={crop.scale} imagePosition={crop.position} /></aside>
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
