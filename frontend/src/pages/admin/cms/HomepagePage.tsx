import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import { LoadingState } from '../../../components/ui/Feedback'
import { useAddHeroImage, useAdminHeroImages, useRemoveHeroImage, useUpdateHeroImage } from '../../../hooks/useCms'
import { apiClient } from '../../../services/apiClient'

interface DisplayImage {
  id: string
  image_url: string
  alt_text: string
  sort_order: number
  isPending?: true
}

interface QueueItem {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

export function HomepagePage() {
  const { data: images, isLoading } = useAdminHeroImages()
  const addImage = useAddHeroImage()
  const removeImage = useRemoveHeroImage()
  const reorderImage = useUpdateHeroImage()

  const [displayImages, setDisplayImages] = useState<DisplayImage[]>([])
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set())
  const [pendingAdds, setPendingAdds] = useState<{ tempId: string; url: string; alt_text: string }[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [imgDropOver, setImgDropOver] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragSrcId = useRef<string | null>(null)

  useEffect(() => {
    if (!images || saving) return
    setDisplayImages([...images].sort((a, b) => a.sort_order - b.sort_order))
    setPendingRemoveIds(new Set())
    setPendingAdds([])
    setDirty(false)
  }, [images, saving])

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
    setSaved(false)
  }

  function handleDrop() { dragSrcId.current = null }

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
        const tempId = item.id
        const newImg: DisplayImage = {
          id: tempId,
          image_url: data.url,
          alt_text: item.file.name.replace(/\.[^.]+$/, ''),
          sort_order: 0,
          isPending: true,
        }
        setDisplayImages(prev => [...prev, newImg])
        setPendingAdds(prev => [...prev, { tempId, url: data.url, alt_text: newImg.alt_text }])
        setDirty(true)
        setSaved(false)
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

  function confirmRemove() {
    if (!removeTarget) return
    const img = displayImages.find(i => i.id === removeTarget)
    if (!img) { setRemoveTarget(null); return }
    if (img.isPending) {
      setPendingAdds(prev => prev.filter(a => a.tempId !== removeTarget))
    } else {
      setPendingRemoveIds(prev => new Set([...prev, removeTarget]))
    }
    setDisplayImages(prev => prev.filter(i => i.id !== removeTarget))
    setDirty(true)
    setSaved(false)
    setRemoveTarget(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      for (const id of pendingRemoveIds) {
        await removeImage.mutateAsync(id)
      }

      const tempToReal = new Map<string, string>()
      for (const add of pendingAdds) {
        const result = await addImage.mutateAsync({
          image_url: add.url,
          alt_text: add.alt_text,
          sort_order: 0,
        })
        tempToReal.set(add.tempId, result.id)
      }

      const finalOrder = displayImages
        .filter(img => !pendingRemoveIds.has(img.id))
        .map(img => img.isPending ? tempToReal.get(img.id) ?? img.id : img.id)

      await Promise.all(finalOrder.map((id, idx) => reorderImage.mutateAsync({ imageId: id, sort_order: idx })))

      setPendingRemoveIds(new Set())
      setPendingAdds([])
      setDirty(false)
      setSaved(true)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingState text="Loading homepage images…" />

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Homepage</h1>
          <p>Hero images rotate on the public homepage in the order below</p>
        </div>
      </div>

      {dirty && <div className="cms-unsaved-banner" role="status">You have unsaved changes — click Save Changes to apply.</div>}

      <form onSubmit={handleSave}>
        <div className="gallery-upload-panel">
          <h3 className="gallery-upload-panel__title">
            Hero images
            <span className="gallery-upload-panel__count">{displayImages.length}</span>
          </h3>

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
                    </div>
                  )}
                  <button
                    type="button"
                    className="gallery-image-card__remove"
                    onClick={e => {
                      e.stopPropagation()
                      setRemoveTarget(img.id)
                    }}
                    aria-label={`Remove ${img.alt_text || 'image'}`}
                    title="Delete image"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="gallery-upload-panel__empty">No images yet. Drop some above to get started.</p>
          )}
        </div>

        {saveError && <p className="admin-form-error" role="alert">{saveError}</p>}

        <div className="admin-form-actions" style={{ marginTop: '1rem' }}>
          <button type="submit" className="button button--primary" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && !dirty && <span style={{ color: '#1a6b3c', fontSize: '.88rem' }}>✓ Saved</span>}
        </div>
      </form>

      {removeTarget && (
        <ConfirmDialog
          title="Remove image?"
          message="This image will be removed. Click Save Changes to apply."
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
