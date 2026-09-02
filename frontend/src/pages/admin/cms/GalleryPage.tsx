import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAdminAlbums, useAdminAlbum, useCreateAlbum, useUpdateAlbum,
  usePublishAlbum, useAddImage, useRemoveImage,
} from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, UnsavedBanner, FormSection, Field } from '../../../components/admin/CmsShared'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import type { AlbumPayload, ImagePayload } from '../../../types/cms'

export function GalleryPage() {
  const { data, isLoading, isError } = useAdminAlbums({})

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Gallery</h1><p>Manage photo albums</p></div>
        <Link to="/admin/content/gallery/new" className="button button--primary">+ New Album</Link>
      </div>

      {isLoading && <p role="status">Loading…</p>}
      {isError && <p role="alert" style={{ color: '#a0332b' }}>Failed to load albums.</p>}

      <div className="cms-album-grid">
        {data?.items.map(album => (
          <div key={album.id} className="cms-album-card">
            {album.cover_image_url ? (
              <img src={album.cover_image_url} alt={album.title} className="cms-album-cover" />
            ) : (
              <div className="cms-album-cover cms-album-cover--empty" aria-hidden="true" />
            )}
            <div className="cms-album-info">
              <strong>{album.title}</strong>
              <span>{album.images.length} image{album.images.length !== 1 ? 's' : ''}</span>
              <CmsStatusBadge status={album.status} />
            </div>
            <div className="cms-album-actions">
              <Link to={`/admin/content/gallery/${album.id}`} className="button button--outline" style={{ fontSize: '.82rem' }}>Manage</Link>
              <Link to={`/admin/content/gallery/${album.id}/edit`} className="button button--ghost" style={{ fontSize: '.82rem' }}>Edit</Link>
            </div>
          </div>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <div className="admin-empty"><p>No albums yet. Create your first album.</p></div>
        )}
      </div>
    </div>
  )
}

// ── Album Form ────────────────────────────────────────────────────────────────
export function AlbumFormPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const isEdit = !!albumId
  const navigate = useNavigate()

  const { data: existing, isLoading } = useAdminAlbum(albumId)
  const create = useCreateAlbum()
  const update = useUpdateAlbum(albumId ?? '')
  const publish = usePublishAlbum()

  const [form, setForm] = useState<AlbumPayload>({ title: '', description: '', cover_image_url: '' })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | 'archive' | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({ title: existing.title, description: existing.description ?? '', cover_image_url: existing.cover_image_url ?? '' })
      setDirty(false)
    }
  }, [existing])

  function set(field: keyof AlbumPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload: AlbumPayload = {
        ...form,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
      }
      if (isEdit) {
        await update.mutateAsync(payload)
        setDirty(false)
      } else {
        const created = await create.mutateAsync(payload)
        navigate(`/admin/content/gallery/${created.id}`, { replace: true })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? 'Edit Album' : 'New Album'}</h1>
          {isEdit && existing && <CmsStatusBadge status={existing.status} />}
        </div>
        <Link to="/admin/content/gallery" className="button button--outline">← Back</Link>
      </div>

      <UnsavedBanner dirty={dirty} />

      <div className="cms-editor-layout">
        <form className="cms-form" onSubmit={handleSave}>
          <FormSection title="Album details">
            <Field label="Title *">
              <input value={form.title} onChange={e => set('title', e.target.value)} required maxLength={250} />
            </Field>
            <Field label="Description">
              <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} />
            </Field>
            <Field label="Cover image URL" helper="Paste an absolute https:// URL.">
              <input type="url" value={form.cover_image_url ?? ''} onChange={e => set('cover_image_url', e.target.value)} maxLength={2048} />
            </Field>
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="Cover preview" className="cms-image-preview" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
          </FormSection>

          {error && <p className="admin-form-error" role="alert">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Album'}
            </button>
            {isEdit && (
              <Link to={`/admin/content/gallery/${albumId}`} className="button button--outline">Manage Images</Link>
            )}
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
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} album?`}
          message={confirmAction === 'publish' ? 'This album will become visible to public visitors.' : confirmAction === 'unpublish' ? 'This album will be hidden from public visitors.' : 'This album will be archived.'}
          confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          onConfirm={() => void publish.mutateAsync({ id: albumId!, action: confirmAction }).then(() => setConfirmAction(null))}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

// ── Album Detail (image management) ──────────────────────────────────────────
export function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const { data: album, isLoading } = useAdminAlbum(albumId)
  const addImage = useAddImage(albumId ?? '')
  const removeImage = useRemoveImage(albumId ?? '')

  const [imgForm, setImgForm] = useState<ImagePayload>({ image_url: '', alt_text: '', caption: '', sort_order: 0 })
  const [imgError, setImgError] = useState('')
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  async function handleAddImage(e: React.FormEvent) {
    e.preventDefault()
    setImgError('')
    try {
      await addImage.mutateAsync({ ...imgForm, caption: imgForm.caption || null })
      setImgForm({ image_url: '', alt_text: '', caption: '', sort_order: 0 })
    } catch (err: unknown) {
      setImgError(err instanceof Error ? err.message : 'Failed to add image.')
    }
  }

  if (isLoading) return <p role="status">Loading…</p>
  if (!album) return <p role="alert">Album not found.</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>{album.title}</h1>
          <CmsStatusBadge status={album.status} />
        </div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <Link to={`/admin/content/gallery/${albumId}/edit`} className="button button--outline">Edit Album</Link>
          <Link to="/admin/content/gallery" className="button button--ghost">← Back</Link>
        </div>
      </div>

      <div className="cms-image-grid">
        {album.images.map(img => (
          <div key={img.id} className="cms-image-item">
            <img src={img.image_url} alt={img.alt_text} />
            <div className="cms-image-item__meta">
              <span>{img.alt_text}</span>
              {img.caption && <span className="cms-image-item__caption">{img.caption}</span>}
            </div>
            <button
              className="cms-image-item__remove"
              onClick={() => setRemoveTarget(img.id)}
              aria-label={`Remove ${img.alt_text}`}
            >×</button>
          </div>
        ))}
        {album.images.length === 0 && (
          <div className="admin-empty"><p>No images yet. Add the first image below.</p></div>
        )}
      </div>

      <div className="cms-form-section" style={{ marginTop: '2rem' }}>
        <h2 className="cms-form-section__title">Add image</h2>
        <form className="cms-form" onSubmit={handleAddImage}>
          <Field label="Image URL *" helper="Paste an absolute https:// URL. No file uploads — use an external host or Supabase Storage.">
            <input type="url" value={imgForm.image_url} onChange={e => setImgForm(f => ({ ...f, image_url: e.target.value }))} required maxLength={2048} />
          </Field>
          {imgForm.image_url && (
            <img src={imgForm.image_url} alt="Preview" className="cms-image-preview" onError={e => (e.currentTarget.style.display = 'none')} />
          )}
          <Field label="Alt text *" helper="Describe the image for accessibility.">
            <input value={imgForm.alt_text} onChange={e => setImgForm(f => ({ ...f, alt_text: e.target.value }))} required maxLength={500} />
          </Field>
          <Field label="Caption">
            <input value={imgForm.caption ?? ''} onChange={e => setImgForm(f => ({ ...f, caption: e.target.value }))} maxLength={500} />
          </Field>
          <Field label="Sort order">
            <input type="number" value={imgForm.sort_order} onChange={e => setImgForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} min={0} />
          </Field>
          {imgError && <p className="admin-form-error" role="alert">{imgError}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={addImage.isPending}>
              {addImage.isPending ? 'Adding…' : 'Add Image'}
            </button>
          </div>
        </form>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Remove image?"
          message="This image will be permanently removed from the album."
          confirmLabel="Remove"
          onConfirm={() => void removeImage.mutateAsync(removeTarget).then(() => setRemoveTarget(null))}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
