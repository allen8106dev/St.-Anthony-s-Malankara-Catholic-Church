import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useAdminSermons, useAdminSermon, useCreateSermon, useUpdateSermon,
  usePublishSermon, useSermonSeries, useCreateSermonSeries,
} from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, UnsavedBanner, FormSection, Field } from '../../../components/admin/CmsShared'
import { Pagination, SkeletonRows, ConfirmDialog } from '../../../components/admin/AdminShared'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import type { SermonPayload } from '../../../types/cms'

export function SermonsPage() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') ?? '1', 10)
  const search = params.get('search') ?? ''
  const status = params.get('status') ?? ''

  const [searchInput, setSearchInput] = useState(search)
  const { data, isLoading, isError } = useAdminSermons({ page, search, status })

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
        <div><h1>Sermons</h1><p>Manage homilies and reflections</p></div>
        <Link to="/admin/content/sermons/new" className="button button--primary">+ Add Sermon</Link>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input type="search" placeholder="Search sermons…" value={searchInput}
            onChange={e => setSearchInput(e.target.value)} aria-label="Search sermons" />
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
        <table className="admin-table" aria-label="Sermons">
          <thead><tr>
            <th>Title</th><th>Speaker</th><th>Date</th><th>Series</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && <tr><td colSpan={6}><p role="alert" style={{ padding: '1rem', color: '#a0332b' }}>Failed to load sermons.</p></td></tr>}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><p>No sermons found.</p></div></td></tr>
            )}
            {data?.items.map(s => (
              <tr key={s.id}>
                <td><strong>{s.title}</strong></td>
                <td>{s.speaker_name ?? '—'}</td>
                <td>{new Date(s.date + 'T00:00:00').toLocaleDateString()}</td>
                <td>{s.series?.title ?? '—'}</td>
                <td><CmsStatusBadge status={s.status} /></td>
                <td>
                  <div className="actions">
                    <Link to={`/admin/content/sermons/${s.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
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

// ── Sermon Form ───────────────────────────────────────────────────────────────
export function SermonFormPage() {
  const { sermonId } = useParams<{ sermonId: string }>()
  const isEdit = !!sermonId
  const navigate = useNavigate()

  const { data: existing, isLoading } = useAdminSermon(sermonId)
  const { data: seriesList } = useSermonSeries()
  const create = useCreateSermon()
  const update = useUpdateSermon(sermonId ?? '')
  const publish = usePublishSermon()
  const createSeries = useCreateSermonSeries()

  const [form, setForm] = useState<SermonPayload>({
    title: '', speaker_name: '', date: '', scripture_reference: '',
    description: '', video_url: '', thumbnail_url: '', series_id: null,
  })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | 'archive' | null>(null)
  const [newSeriesTitle, setNewSeriesTitle] = useState('')
  const [showNewSeries, setShowNewSeries] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        speaker_name: existing.speaker_name ?? '',
        date: existing.date,
        scripture_reference: existing.scripture_reference ?? '',
        description: existing.description ?? '',
        video_url: existing.video_url ?? '',
        thumbnail_url: existing.thumbnail_url ?? '',
        series_id: existing.series_id,
      })
      setDirty(false)
    }
  }, [existing])

  function set(field: keyof SermonPayload, value: string | null) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload: SermonPayload = {
        ...form,
        speaker_name: form.speaker_name || null,
        scripture_reference: form.scripture_reference || null,
        description: form.description || null,
        video_url: form.video_url || null,
        thumbnail_url: form.thumbnail_url || null,
      }
      if (isEdit) {
        await update.mutateAsync(payload)
      } else {
        const created = await create.mutateAsync(payload)
        navigate(`/admin/content/sermons/${created.id}/edit`, { replace: true })
      }
      setDirty(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  async function handleAddSeries() {
    if (!newSeriesTitle.trim()) return
    const s = await createSeries.mutateAsync({ title: newSeriesTitle.trim() })
    set('series_id', s.id)
    setNewSeriesTitle('')
    setShowNewSeries(false)
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Sermon' : 'New Sermon'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <Link to="/admin/content/sermons" className="button button--outline">← Back</Link>
      </div>

      <UnsavedBanner dirty={dirty} />

      <div className="cms-editor-layout">
        <form className="cms-form" onSubmit={handleSave}>
          <FormSection title="Sermon details">
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
            </Field>
            <div className="admin-form-row">
              <Field label="Speaker">
                <input value={form.speaker_name ?? ''} onChange={e => set('speaker_name', e.target.value)} maxLength={200} />
              </Field>
              <Field label="Date *">
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </Field>
            </div>
            <Field label="Scripture reference">
              <input value={form.scripture_reference ?? ''} onChange={e => set('scripture_reference', e.target.value)} maxLength={500} />
            </Field>
            <Field label="Description">
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={4} />
            </Field>
          </FormSection>

          <FormSection title="Media">
            <Field label="Video URL" helper="YouTube or other video URL. No file uploads — use an external host.">
              <input type="url" value={form.video_url ?? ''} onChange={e => set('video_url', e.target.value)} maxLength={2048} />
            </Field>
            <ImageUploader
              value={form.thumbnail_url ?? ''}
              onChange={val => set('thumbnail_url', val)}
              label="Thumbnail Image"
              helper="Upload sermon thumbnail (max 5 MB)."
            />
          </FormSection>

          <FormSection title="Series">
            <Field label="Series">
              <select value={form.series_id ?? ''} onChange={e => set('series_id', e.target.value || null)}>
                <option value="">No series</option>
                {seriesList?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </Field>
            {!showNewSeries ? (
              <button type="button" className="button button--ghost" style={{ fontSize: '.82rem' }} onClick={() => setShowNewSeries(true)}>
                + New series
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
                <input value={newSeriesTitle} onChange={e => setNewSeriesTitle(e.target.value)} placeholder="Series title" style={{ flex: 1, padding: '.5rem', border: '1px solid var(--border)' }} />
                <button type="button" className="button button--primary" onClick={() => void handleAddSeries()} disabled={createSeries.isPending}>Add</button>
                <button type="button" className="button button--outline" onClick={() => setShowNewSeries(false)}>Cancel</button>
              </div>
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
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} sermon?`}
          message={confirmAction === 'publish' ? 'This sermon will become visible to public visitors.' : confirmAction === 'unpublish' ? 'This sermon will be hidden from public visitors.' : 'This sermon will be archived.'}
          confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          onConfirm={() => void publish.mutateAsync({ id: sermonId!, action: confirmAction }).then(() => setConfirmAction(null))}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
