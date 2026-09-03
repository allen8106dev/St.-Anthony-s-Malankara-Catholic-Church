import { useEffect, useRef, useState, type DragEvent } from 'react'
import { apiClient } from '../../services/apiClient'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  onCropChange?: (crop: { scale: number; position: number }) => void
  label?: string
  helper?: string
}

export function ImageUploader({
  value,
  onChange,
  onCropChange,
  label = 'Image',
  helper = 'JPG, PNG, WebP, or GIF (max 5 MB)',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [filename, setFilename] = useState('')
  const [localPreview, setLocalPreview] = useState('')
  const [crop, setCrop] = useState({ scale: 100, position: 50 })

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  async function choose(file: File) {
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      return setError('Please choose a valid JPG, PNG, WebP, or GIF image.')
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError('Images must be 5 MB or smaller.')
    }
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(URL.createObjectURL(file))
    setFilename(file.name)
    const data = new FormData()
    data.append('file', file)
    setUploading(true)

    try {
      const response = await apiClient.post<{ url: string }>('/admin/cms/uploads/image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(response.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setLocalPreview('')
      setFilename('')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void choose(file)
  }

  const preview = localPreview || value

  return (
    <div className="image-uploader-wrap">
      {label && <span className="image-uploader-label">{label}</span>}

      <div
        className={`image-uploader-dropzone ${dragOver ? 'image-uploader-dropzone--drag' : ''} ${preview ? 'image-uploader-dropzone--has-image' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="image-uploader-preview-container">
            <div className="image-uploader-preview-frame">
              <img
                src={preview}
                alt="Selected preview"
                className="image-uploader-preview-img"
                style={{
                  objectPosition: `${crop.position}% center`,
                  transform: `scale(${crop.scale / 100})`,
                }}
              />
            </div>
            {uploading && (
              <div className="image-uploader-uploading-overlay">
                <span className="image-uploader-spinner" />
                <span>Uploading image…</span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="image-uploader-empty"
            onClick={() => !uploading && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          >
            <div className="image-uploader-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="4" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <p className="image-uploader-prompt">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <span className="image-uploader-sub">{helper}</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void choose(file)
            e.target.value = ''
          }}
        />
      </div>

      {preview && (
        <div className="image-uploader-controls">
          <div className="image-uploader-meta">
            {filename && <span className="image-uploader-filename">{filename}</span>}
          </div>
          <div className="image-uploader-actions">
            <button
              type="button"
              className="button button--outline button--sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Replace Image'}
            </button>
            <button
              type="button"
              className="button button--ghost button--sm image-uploader-remove-btn"
              disabled={uploading}
              onClick={() => {
                onChange('')
                setFilename('')
                setLocalPreview('')
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {value && onCropChange && (
        <div className="image-crop-controls">
          <label>
            <span>Crop Zoom</span>
            <input
              type="range"
              min="100"
              max="150"
              value={crop.scale}
              onChange={e => {
                const next = { ...crop, scale: Number(e.target.value) }
                setCrop(next)
                onCropChange(next)
              }}
            />
          </label>
          <label>
            <span>Focal Point</span>
            <input
              type="range"
              min="0"
              max="100"
              value={crop.position}
              onChange={e => {
                const next = { ...crop, position: Number(e.target.value) }
                setCrop(next)
                onCropChange(next)
              }}
            />
          </label>
        </div>
      )}

      {error && <p className="admin-form-error" role="alert">{error}</p>}
    </div>
  )
}