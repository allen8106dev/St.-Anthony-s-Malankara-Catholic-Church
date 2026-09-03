import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAdminAlbums, useAdminAlbum, useCreateAlbum, useUpdateAlbum,
  usePublishAlbum, useDeleteAlbum, useAddImage, useRemoveImage, useReorderImage,
} from '../../../hooks/useCms'
import { CmsStatusBadge, PublishActions, FormSection, Field } from '../../../components/admin/CmsShared'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import { apiClient } from '../../../services/apiClient'
import type { AlbumPayload } from '../../../types/cms'

// ── Album List ────────────────────────────────────────────────────────────────
export function GalleryPage() {
  const { data, isLoading, isError } = useAdminAlbums({})
  const create = useCreateAlbum()
  const deleteAlbum = useDeleteAlbum()
  const navigate = useNavigate()
  const [createError, setCreateError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  async function handleCreateDirect() {
    setCreateError('')
    try {
      const created = await create.mutateAsync({ title: 'Untitled Album' })
      navigate(`/admin/content/gallery/${created.id}`)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create album.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Gallery</h1><p>Manage photo albums</p></div>
        <button
          type="button"
          onClick={handleCreateDirect}
          className="button button--primary"
          disabled={create.isPending}
        >
          {create.isPending ? 'Creating…' : '+ New Album'}
        </button>
      </div>

      {createError && <p className="admin-form-error" role="alert" style={{ marginBottom: '1rem' }}>{createError}</p>}
      {isLoading && <p role="status">Loading…</p>}
      {isError && <p role="alert" style={{ color: '#a0332b' }}>Failed to load albums.</p>}

      <div className="cms-album-grid">
        {data?.items.map(album => (
          <div
            key={album.id}
            className="cms-album-card cms-album-card--interactive"
            onClick={() => navigate(`/admin/content/gallery/${album.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/admin/content/gallery/${album.id}`)
              }
            }}
          >
            {album.cover_image_url ? (
              <img src={album.cover_image_url} alt={album.title} className="cms-album-cover" />
            ) : (
              <div className="cms-album-cover cms-album-cover--empty" aria-hidden="true" />
            )}
            <div className="cms-album-info">
              <div className="cms-album-info__row">
                <strong>{album.title}</strong>
                <button
                  type="button"
                  className="button button--ghost button--sm cms-album-delete-btn"
                  onClick={e => {
                    e.stopPropagation()
                    setDeleteTarget({ id: album.id, title: album.title })
                  }}
                  aria-label={`Delete ${album.title}`}
                  title="Delete Album"
                >
                  Delete
                </button>
              </div>
              <span>{album.images.length} image{album.images.length !== 1 ? 's' : ''}</span>
              <CmsStatusBadge status={album.status} />
            </div>
          </div>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <div className="admin-empty"><p>No albums yet. Create your first album.</p></div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Album?"
          message={`Are you sure you want to delete "${deleteTarget.title}"? All images inside it will also be deleted. This cannot be undone.`}
          confirmLabel="Delete Album"
          onConfirm={() => void deleteAlbum.mutateAsync(deleteTarget.id).then(() => setDeleteTarget(null))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ── New Album (creation redirect — forwards directly to unified editor) ────────
export function AlbumFormPage() {
  const navigate = useNavigate()
  const create = useCreateAlbum()
  const [error, setError] = useState('')
  const creationAttempted = useRef(false)

  useEffect(() => {
    if (creationAttempted.current) return
    creationAttempted.current = true
    create.mutateAsync({ title: 'Untitled Album' })
      .then(created => {
        navigate(`/admin/content/gallery/${created.id}`, { replace: true })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to create album.')
      })
  }, [create, navigate])

  return (
    <div style={{ maxWidth: '36rem' }}>
      <div className="admin-page-header">
        <div><h1>Creating Album…</h1></div>
        <Link to="/admin/content/gallery" className="button button--outline">← Back</Link>
      </div>
      {error ? (
        <div>
          <p className="admin-form-error" role="alert">{error}</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              creationAttempted.current = false
              setError('')
              create.mutateAsync({ title: 'Untitled Album' })
                .then(created => navigate(`/admin/content/gallery/${created.id}`, { replace: true }))
                .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to create album.'))
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <p role="status">Preparing album editor…</p>
      )}
    </div>
  )
}

// ── Display image (existing or pending-add) ───────────────────────────────────
interface DisplayImage {
  id: string            // real DB id for existing; tempId for pending adds
  image_url: string
  alt_text: string
  caption: string | null
  sort_order: number
  isPending?: true      // marks images not yet persisted to DB
}

// ── Upload queue item ─────────────────────────────────────────────────────────
interface QueueItem {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

// ── Unified Album Editor ───────────────────────────────────────────────────────
export function AlbumEditorPage() {
  const { albumId } = useParams<{ albumId: string }>()
  const navigate = useNavigate()
  const { data: album, isLoading } = useAdminAlbum(albumId)
  const update = useUpdateAlbum(albumId ?? '')
  const publish = usePublishAlbum()
  const deleteAlbum = useDeleteAlbum()
  const addImage = useAddImage(albumId ?? '')
  const removeImage = useRemoveImage(albumId ?? '')
  const reorderImage = useReorderImage(albumId ?? '')

  // ── Album metadata form state
  const [form, setForm] = useState<AlbumPayload>({ title: '', description: '', cover_image_url: '' })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmPublish, setConfirmPublish] = useState<'publish' | 'unpublish' | 'archive' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const titleFocusedRef = useRef(false)

  // ── Local image display state (deferred — only flushed on Save)
  const [displayImages, setDisplayImages] = useState<DisplayImage[]>([])
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set())
  const [pendingAdds, setPendingAdds] = useState<{ tempId: string; url: string; alt_text: string }[]>([])

  // ── Upload queue (visual feedback only)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [imgDropOver, setImgDropOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  // ── Drag-reorder refs
  const dragSrcId = useRef<string | null>(null)

  // Sync form + displayImages when album loads
  useEffect(() => {
    if (album) {
      setForm({ title: album.title, description: album.description ?? '', cover_image_url: album.cover_image_url ?? '' })
      setDisplayImages([...album.images].sort((a, b) => a.sort_order - b.sort_order))
      setPendingRemoveIds(new Set())
      setPendingAdds([])
      setDirty(false)
      if (!titleFocusedRef.current && album.title === 'Untitled Album') {
        titleFocusedRef.current = true
        setTimeout(() => { titleInputRef.current?.focus(); titleInputRef.current?.select() }, 50)
      }
    }
  }, [album])

  function setField(field: keyof AlbumPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  // ── Drag-to-reorder (local only — flushed on Save)
  function handleDragStart(id: string) { dragSrcId.current = id }

  function handleDragOver(e: DragEvent<HTMLDivElement>, targetId: string) {
    e.preventDefault()
    if (!dragSrcId.current || dragSrcId.current === targetId) return
    setDisplayImages(prev => {
      const srcIdx = prev.findIndex(i => i.id === dragSrcId.current)
      const tgtIdx = prev.findIndex(i => i.id === targetId)
      if (srcIdx === -1 || tgtIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(srcIdx, 1)
      next.splice(tgtIdx, 0, moved)
      return next
    })
    setDirty(true)
  }

  function handleDrop() { dragSrcId.current = null }

  // ── Upload files: upload to storage immediately (to get URL), but queue add for Save
  const uploadFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type))
    if (!imageFiles.length) return

    const items: QueueItem[] = imageFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
    }))
    setQueue(prev => [...prev, ...items])

    await Promise.all(items.map(async item => {
      try {
        const fd = new FormData()
        fd.append('file', item.file)
        const { data } = await apiClient.post<{ url: string }>('/admin/cms/uploads/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        // Queue the add — do NOT call addImage.mutateAsync yet
        const tempId = item.id
        const newImg: DisplayImage = {
          id: tempId,
          image_url: data.url,
          alt_text: item.file.name.replace(/\.[^.]+$/, ''),
          caption: null,
          sort_order: 0,
          isPending: true,
        }
        setDisplayImages(prev => [...prev, newImg])
        setPendingAdds(prev => [...prev, { tempId, url: data.url, alt_text: newImg.alt_text }])
        setDirty(true)
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done' } : q))
      } catch (err) {
        setQueue(prev => prev.map(q => q.id === item.id ? {
          ...q, status: 'error', error: err instanceof Error ? err.message : 'Upload failed',
        } : q))
      }
    }))

    setTimeout(() => {
      setQueue(prev => prev.filter(q => q.status !== 'done'))
      items.forEach(i => URL.revokeObjectURL(i.preview))
    }, 1800)
  }, [])

  function handleImgDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setImgDropOver(false)
    void uploadFiles(Array.from(e.dataTransfer.files))
  }

  // ── Remove image (local only — flushed on Save)
  function confirmRemove() {
    if (!removeTarget) return
    const img = displayImages.find(i => i.id === removeTarget)
    if (!img) { setRemoveTarget(null); return }
    if (img.isPending) {
      // Not yet in DB — just remove from local state
      setPendingAdds(prev => prev.filter(a => a.tempId !== removeTarget))
    } else {
      // Existing DB image — mark for deletion on Save
      setPendingRemoveIds(prev => new Set([...prev, removeTarget]))
    }
    setDisplayImages(prev => prev.filter(i => i.id !== removeTarget))
    setDirty(true)
    setRemoveTarget(null)
  }

  // ── Save: persist all queued changes
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      // 1. Save album metadata
      await update.mutateAsync({
        ...form,
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
      })

      // 2. Remove pending removes
      for (const id of pendingRemoveIds) {
        await removeImage.mutateAsync(id)
      }

      // 3. Add pending adds — collect tempId → real ID mapping
      const tempToReal = new Map<string, string>()
      for (const add of pendingAdds) {
        const result = await addImage.mutateAsync({
          image_url: add.url,
          alt_text: add.alt_text,
          caption: null,
          sort_order: 0,
        })
        tempToReal.set(add.tempId, result.id)
      }

      // 4. Persist final sort order for all remaining images
      const finalOrder = displayImages
        .filter(img => !pendingRemoveIds.has(img.id))
        .map(img => img.isPending ? tempToReal.get(img.id) ?? img.id : img.id)

      await Promise.all(finalOrder.map((id, idx) => reorderImage.mutateAsync({ imageId: id, sort_order: idx })))

      // 5. Clear pending state
      setPendingRemoveIds(new Set())
      setPendingAdds([])
      setDirty(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <p role="status">Loading…</p>
  if (!album) return <p role="alert">Album not found.</p>

  return (
    <div>
      {/* ── Header: all action buttons in one row ── */}
      <div className="admin-page-header">
        <div>
          <h1>{album.title}</h1>
          <CmsStatusBadge status={album.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
          <PublishActions
            status={album.status}
            onPublish={() => setConfirmPublish('publish')}
            onUnpublish={() => setConfirmPublish('unpublish')}
            onArchive={() => setConfirmPublish('archive')}
            loading={publish.isPending}
          />
          <Link to="/admin/content/gallery" className="button button--outline">← All Albums</Link>
          <button
            type="button"
            className="button button--ghost"
            style={{ color: '#dc2626' }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {dirty && <div className="cms-unsaved-banner" role="status">You have unsaved changes — click Save Changes to apply.</div>}

      <div className="gallery-editor-layout">
        {/* ── Left: album metadata form ── */}
        <div className="gallery-editor-form">
          <form className="cms-form" onSubmit={handleSave}>
            <FormSection title="Album details">
              <Field label="Title *">
                <input ref={titleInputRef} value={form.title} onChange={e => setField('title', e.target.value)} required maxLength={250} />
              </Field>
              <Field label="Description">
                <textarea value={form.description ?? ''} onChange={e => setField('description', e.target.value)} rows={3} />
              </Field>
              <ImageUploader
                value={form.cover_image_url ?? ''}
                onChange={val => setField('cover_image_url', val)}
                label="Cover Image"
                helper="Upload album cover image (max 5 MB)."
              />
            </FormSection>

            {saveError && <p className="admin-form-error" role="alert">{saveError}</p>}

            <div className="admin-form-actions">
              <button type="submit" className="button button--primary" disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: image upload + drag-reorder panel ── */}
        <div className="gallery-upload-panel">
          <h3 className="gallery-upload-panel__title">
            Images
            <span className="gallery-upload-panel__count">{displayImages.length}</span>
          </h3>

          {/* Drop zone */}
          <div
            className={`gallery-dropzone${imgDropOver ? ' gallery-dropzone--over' : ''}`}
            onDragOver={e => { e.preventDefault(); setImgDropOver(true) }}
            onDragLeave={() => setImgDropOver(false)}
            onDrop={handleImgDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click() }}
            aria-label="Drop images here or click to select"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span><strong>Click or drop</strong> to add images</span>
            <span className="gallery-dropzone__sub">JPG, PNG, WebP, GIF — multiple at once</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={e => {
                const files = Array.from(e.target.files ?? [])
                if (files.length) void uploadFiles(files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Upload queue */}
          {queue.length > 0 && (
            <ul className="gallery-upload-queue" role="list">
              {queue.map(item => (
                <li key={item.id} className={`gallery-queue-item gallery-queue-item--${item.status}`}>
                  <img src={item.preview} alt="" className="gallery-queue-item__thumb" />
                  <span className="gallery-queue-item__name">{item.file.name}</span>
                  <span className="gallery-queue-item__status" aria-live="polite">
                    {item.status === 'uploading' && <span className="gallery-queue-spinner" aria-label="Uploading" />}
                    {item.status === 'done' && <span className="gallery-queue-check" aria-label="Done">✓</span>}
                    {item.status === 'error' && <span className="gallery-queue-error" title={item.error} aria-label="Error">✕</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Image grid — drag to reorder */}
          {displayImages.length > 0 ? (
            <div className="gallery-image-grid" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
              {displayImages.map((img, idx) => (
                <div
                  key={img.id}
                  className={`gallery-image-card${img.isPending ? ' gallery-image-card--pending' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(img.id)}
                  onDragOver={e => handleDragOver(e, img.id)}
                  aria-label={`Image ${idx + 1}: ${img.alt_text}`}
                >
                  <span className="gallery-image-card__order" aria-label={`Position ${idx + 1}`}>
                    #{idx + 1}
                  </span>
                  <div className="gallery-image-card__drag-handle" aria-hidden="true">⠿</div>
                  <img src={img.image_url} alt={img.alt_text} className="gallery-image-card__img" />
                  {img.isPending && <span className="gallery-image-card__pending-badge">Unsaved</span>}
                  {img.alt_text && (
                    <div className="gallery-image-card__meta">
                      <span>{img.alt_text}</span>
                      {img.caption && <span className="gallery-image-card__caption">{img.caption}</span>}
                    </div>
                  )}
                  <button
                    type="button"
                    className="gallery-image-card__remove"
                    onClick={() => setRemoveTarget(img.id)}
                    aria-label={`Remove ${img.alt_text}`}
                  >×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="gallery-upload-panel__empty">No images yet. Drop some above to get started.</p>
          )}
        </div>
      </div>

      {/* Confirm remove image */}
      {removeTarget && (
        <ConfirmDialog
          title="Remove image?"
          message="This image will be removed. Click Save Changes to apply."
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* Confirm publish action */}
      {confirmPublish && (
        <ConfirmDialog
          title={`${confirmPublish.charAt(0).toUpperCase() + confirmPublish.slice(1)} album?`}
          message={
            confirmPublish === 'publish' ? 'This album will become visible to public visitors.' :
            confirmPublish === 'unpublish' ? 'This album will be hidden from public visitors.' :
            'This album will be archived.'
          }
          confirmLabel={confirmPublish.charAt(0).toUpperCase() + confirmPublish.slice(1)}
          onConfirm={() => void publish.mutateAsync({ id: albumId!, action: confirmPublish }).then(() => setConfirmPublish(null))}
          onCancel={() => setConfirmPublish(null)}
        />
      )}

      {/* Confirm delete album */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Album?"
          message={`Are you sure you want to delete "${album.title}"? All images inside it will also be deleted. This cannot be undone.`}
          confirmLabel="Delete Album"
          onConfirm={() => void deleteAlbum.mutateAsync(albumId!).then(() => navigate('/admin/content/gallery'))}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
