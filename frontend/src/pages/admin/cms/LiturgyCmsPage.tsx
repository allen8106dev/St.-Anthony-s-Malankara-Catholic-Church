import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiClient } from '../../../services/apiClient'
import {
  useAdminLiturgy,
  useCreateLiturgyCollection,
  useDeleteLiturgyCollection,
  useDeleteLiturgyResource,
  useAddLiturgyResource,
  useLiturgyStatus,
  useUpdateLiturgyCollection,
  useUpdateLiturgyResource,
} from '../../../hooks/useCms'
import type { LiturgyCollection } from '../../../types/cms'

interface PendingResource {
  tempId: string
  title: string
  file: File | null
}

export function LiturgyCmsPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const navigate = useNavigate()

  const { data: folders = [], isLoading } = useAdminLiturgy()
  const createCollection = useCreateLiturgyCollection()
  const updateCollection = useUpdateLiturgyCollection()
  const deleteCollection = useDeleteLiturgyCollection()
  const publishCollection = useLiturgyStatus()
  const addResource = useAddLiturgyResource()
  const updateResource = useUpdateLiturgyResource()
  const deleteResource = useDeleteLiturgyResource()

  // ── Index state ─────────────────────────────────────────────────────────────
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)

  // ── Detail / Editor state ───────────────────────────────────────────────────
  const folder = folders.find(item => item.id === collectionId)
  const [folderTitle, setFolderTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [existingTitles, setExistingTitles] = useState<Record<string, string>>({})
  const [replacementPdfs, setReplacementPdfs] = useState<Record<string, File>>({})
  const [deletedResourceIds, setDeletedResourceIds] = useState<Set<string>>(new Set())
  const [newResources, setNewResources] = useState<PendingResource[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const newResourceTitleInputRef = useRef<HTMLInputElement>(null)

  // Reset editor state when folder changes
  useEffect(() => {
    if (folder) {
      setFolderTitle(folder.title)
      setIsEditingTitle(false)
      setExistingTitles(Object.fromEntries(folder.resources.map(r => [r.id, r.title])))
      setReplacementPdfs({})
      setDeletedResourceIds(new Set())
      setNewResources([])
      setSaveMessage(null)
    }
  }, [folder?.id, folder?.title, folder?.resources])

  // Calculate dirty state
  const isTitleDirty = folder ? folderTitle.trim() !== folder.title : false
  const hasExistingTitleChanges = folder
    ? folder.resources.some(
        r => !deletedResourceIds.has(r.id) && existingTitles[r.id] !== undefined && existingTitles[r.id].trim() !== r.title
      )
    : false
  const hasReplacements = Object.keys(replacementPdfs).length > 0
  const hasDeletions = deletedResourceIds.size > 0
  const hasNewResources = newResources.length > 0

  const isDirty = isTitleDirty || hasExistingTitleChanges || hasReplacements || hasDeletions || hasNewResources

  // ── Handle Folder Creation ──────────────────────────────────────────────────
  async function handleCreateFolder(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = newFolderName.trim()
    if (!trimmed) return
    try {
      const created = await createCollection.mutateAsync({ title: trimmed })
      setNewFolderName('')
      setIsCreatingFolder(false)
      navigate(`/admin/content/liturgy/${created.id}`)
    } catch {
      alert('Failed to create folder. Please try again.')
    }
  }

  // ── Handle Folder Deletion ──────────────────────────────────────────────────
  async function handleDeleteFolder(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete the folder "${title}" and all of its resources?`)) return
    setDeletingFolderId(id)
    try {
      await deleteCollection.mutateAsync(id)
      if (collectionId === id) {
        navigate('/admin/content/liturgy')
      }
    } catch {
      alert('Failed to delete folder. Please try again.')
    } finally {
      setDeletingFolderId(null)
    }
  }

  // ── Add new pending resource row ────────────────────────────────────────────
  function handleAddResourceRow() {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setNewResources(prev => [...prev, { tempId, title: '', file: null }])
    setSaveMessage(null)
    setTimeout(() => {
      newResourceTitleInputRef.current?.focus()
    }, 50)
  }

  // ── Remove pending resource row ─────────────────────────────────────────────
  function handleRemovePendingResource(tempId: string) {
    setNewResources(prev => prev.filter(item => item.tempId !== tempId))
  }

  // ── Update pending resource ─────────────────────────────────────────────────
  function handleUpdatePendingResource(tempId: string, updates: Partial<PendingResource>) {
    setNewResources(prev =>
      prev.map(item => (item.tempId === tempId ? { ...item, ...updates } : item))
    )
  }

  // ── Mark existing resource for deletion ─────────────────────────────────────
  function handleToggleDeleteResource(resourceId: string) {
    setDeletedResourceIds(prev => {
      const next = new Set(prev)
      if (next.has(resourceId)) {
        next.delete(resourceId)
      } else {
        next.add(resourceId)
      }
      return next
    })
  }

  // ── Save all changes ────────────────────────────────────────────────────────
  async function handleSaveChanges() {
    if (!folder) return
    setSaveMessage(null)

    // Validate new resources
    for (let i = 0; i < newResources.length; i++) {
      const item = newResources[i]
      if (!item.title.trim()) {
        setSaveMessage({ type: 'error', text: `Please enter a title for new resource #${i + 1}.` })
        return
      }
      if (!item.file) {
        setSaveMessage({ type: 'error', text: `Please select a PDF file for "${item.title}".` })
        return
      }
    }

    // Validate existing titles
    for (const r of folder.resources) {
      if (!deletedResourceIds.has(r.id)) {
        const title = (existingTitles[r.id] ?? r.title).trim()
        if (!title) {
          setSaveMessage({ type: 'error', text: 'Resource titles cannot be blank.' })
          return
        }
      }
    }

    setIsSaving(true)

    try {
      // 1. Update folder title if changed
      if (isTitleDirty && folderTitle.trim()) {
        await updateCollection.mutateAsync({
          id: folder.id,
          data: { title: folderTitle.trim() },
        })
      }

      // 2. Delete marked resources
      for (const resId of deletedResourceIds) {
        await deleteResource.mutateAsync({ collectionId: folder.id, resourceId: resId })
      }

      // 3. Update existing resources (title changes and/or PDF replacements)
      for (const r of folder.resources) {
        if (deletedResourceIds.has(r.id)) continue

        const updatedTitle = (existingTitles[r.id] ?? r.title).trim()
        const titleChanged = updatedTitle !== r.title
        const replacementFile = replacementPdfs[r.id]

        let newPdfUrl: string | undefined = undefined
        if (replacementFile) {
          const form = new FormData()
          form.append('file', replacementFile)
          const uploadRes = await apiClient.post<{ url: string }>('/admin/cms/uploads/pdf', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          newPdfUrl = uploadRes.data.url
        }

        if (titleChanged || newPdfUrl) {
          await updateResource.mutateAsync({
            collectionId: folder.id,
            resourceId: r.id,
            data: {
              ...(titleChanged ? { title: updatedTitle } : {}),
              ...(newPdfUrl ? { pdf_url: newPdfUrl } : {}),
            },
          })
        }
      }

      // 4. Create new pending resources
      for (const item of newResources) {
        if (item.file) {
          const form = new FormData()
          form.append('file', item.file)
          const uploadRes = await apiClient.post<{ url: string }>('/admin/cms/uploads/pdf', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          await addResource.mutateAsync({
            id: folder.id,
            data: {
              title: item.title.trim(),
              pdf_url: uploadRes.data.url,
            },
          })
        }
      }

      // Reset dirty state
      setReplacementPdfs({})
      setDeletedResourceIds(new Set())
      setNewResources([])
      setSaveMessage({ type: 'success', text: 'All changes saved successfully.' })
    } catch (err: unknown) {
      let msg = 'An error occurred while saving.'
      if (err instanceof Error) {
        msg = err.message
      } else if (typeof err === 'string') {
        msg = err
      } else if (err && typeof err === 'object') {
        const anyErr = err as Record<string, unknown>
        const resp = anyErr.response as { data?: { detail?: unknown } } | undefined
        const d = resp?.data?.detail
        if (typeof d === 'string') msg = d
        else if (Array.isArray(d)) msg = d.map((x: { msg?: string }) => x.msg || JSON.stringify(x)).join(', ')
        else if (d) msg = JSON.stringify(d)
        else if (anyErr.message) msg = String(anyErr.message)
      }
      setSaveMessage({ type: 'error', text: `Failed to save changes: ${msg}` })
    } finally {
      setIsSaving(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: ONLY FOLDERS LIST (INDEX VIEW)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!collectionId) {
    return (
      <div className="liturgy-cms">
        {/* Top Header */}
        <div className="admin-page-header">
          <div>
            <h1>Liturgy</h1>
            <p>Select a folder to view and manage its liturgical PDF resources.</p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setIsCreatingFolder(true)}
          >
            + New folder
          </button>
        </div>

        {/* Create Folder Inline Modal / Banner */}
        {isCreatingFolder && (
          <form className="liturgy-cms__new-box" onSubmit={handleCreateFolder}>
            <div className="liturgy-cms__new-title">Create new liturgy folder</div>
            <div className="liturgy-cms__new-row">
              <input
                autoFocus
                className="input"
                placeholder="Folder name (e.g., Holy Qurbono, Novena Prayers)"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <button
                type="submit"
                className="button button--primary"
                disabled={!newFolderName.trim() || createCollection.isPending}
              >
                {createCollection.isPending ? 'Creating...' : 'Create folder'}
              </button>
              <button
                type="button"
                className="button button--outline"
                onClick={() => {
                  setIsCreatingFolder(false)
                  setNewFolderName('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Only list of all folders */}
        <div className="liturgy-cms__folders-grid">
          {isLoading ? (
            <p className="liturgy-cms__loading">Loading folders...</p>
          ) : folders.length > 0 ? (
            folders.map((item: LiturgyCollection) => (
              <div key={item.id} className="liturgy-cms__folder-card">
                <Link
                  to={`/admin/content/liturgy/${item.id}`}
                  className="liturgy-cms__folder-card-main"
                >
                  <div className="liturgy-cms__folder-icon-wrapper" aria-hidden="true">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                    </svg>
                  </div>
                  <div className="liturgy-cms__folder-info">
                    <h2 className="liturgy-cms__folder-name">{item.title}</h2>
                    <span className="liturgy-cms__folder-count">
                      {item.resources.length} {item.resources.length === 1 ? 'resource' : 'resources'}
                    </span>
                  </div>
                </Link>

                <div className="liturgy-cms__folder-footer">
                  <span
                    className={`liturgy-status-badge ${
                      item.status === 'PUBLISHED'
                        ? 'liturgy-status-badge--published'
                        : 'liturgy-status-badge--draft'
                    }`}
                  >
                    {item.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>

                  <div className="liturgy-cms__folder-actions">
                    <button
                      type="button"
                      className="liturgy-btn-icon-danger"
                      title="Delete folder"
                      aria-label={`Delete folder ${item.title}`}
                      disabled={deletingFolderId === item.id}
                      onClick={() => void handleDeleteFolder(item.id, item.title)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                    <Link
                      to={`/admin/content/liturgy/${item.id}`}
                      className="button button--outline button--sm"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="liturgy-cms__empty-folders">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="liturgy-cms__empty-icon"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              <h3>No liturgy folders yet</h3>
              <p>Create a folder to start organizing and publishing liturgical PDF resources.</p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setIsCreatingFolder(true)}
              >
                + New folder
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: INSIDE A FOLDER (RESOURCES LIST & ON-THE-SPOT EDITING)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!folder) {
    return (
      <div className="liturgy-cms">
        <div className="admin-page-header">
          <div>
            <h1>Folder not found</h1>
            <p>The requested liturgy folder could not be found or may have been deleted.</p>
          </div>
          <Link className="button button--outline" to="/admin/content/liturgy">
            ← Back to folders
          </Link>
        </div>
      </div>
    )
  }

  const isPublished = folder.status === 'PUBLISHED'

  return (
    <div className="liturgy-cms">
      {/* Top Header with Breadcrumbs & Action Buttons */}
      <div className="admin-page-header liturgy-cms__detail-header">
        <div>
          <Link className="text-link liturgy-back-link" to="/admin/content/liturgy">
            ← All folders
          </Link>
          <div className="liturgy-folder-title-row">
            {isEditingTitle ? (
              <div className="liturgy-folder-title-edit">
                <input
                  className="input liturgy-folder-title-input"
                  value={folderTitle}
                  onChange={e => setFolderTitle(e.target.value)}
                  autoFocus
                  placeholder="Folder title"
                />
                <button
                  type="button"
                  className="button button--outline button--sm"
                  onClick={() => setIsEditingTitle(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="liturgy-folder-title-display">
                <h1 className="liturgy-folder-title">{folderTitle || folder.title}</h1>
                <button
                  type="button"
                  className="liturgy-btn-text"
                  onClick={() => setIsEditingTitle(true)}
                  title="Rename folder"
                >
                  Rename
                </button>
              </div>
            )}
            <span
              className={`liturgy-status-badge ${
                isPublished ? 'liturgy-status-badge--published' : 'liturgy-status-badge--draft'
              }`}
            >
              {isPublished ? 'Published on website' : 'Draft (hidden)'}
            </span>
          </div>
          <p className="liturgy-folder-subtitle">
            Manage the PDF resources in this folder. Resources are editable on the spot.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="liturgy-cms__top-actions">
          {/* Add resource button top right */}
          <button
            type="button"
            className="button button--outline"
            onClick={handleAddResourceRow}
          >
            + Add resource
          </button>

          {/* Publish / Unpublish button */}
          <button
            type="button"
            className={`button ${isPublished ? 'button--outline' : 'button--primary'}`}
            disabled={publishCollection.isPending}
            onClick={() =>
              void publishCollection.mutate({
                id: folder.id,
                action: isPublished ? 'unpublish' : 'publish',
              })
            }
          >
            {publishCollection.isPending
              ? 'Updating...'
              : isPublished
              ? 'Unpublish folder'
              : 'Publish folder'}
          </button>

          {/* Save changes button top right: ACTIVATES WHEN ANY CHANGE IS MADE */}
          <button
            type="button"
            className={`button button--primary liturgy-cms__save-btn ${
              isDirty ? 'liturgy-cms__save-btn--active' : 'liturgy-cms__save-btn--disabled'
            }`}
            disabled={!isDirty || isSaving}
            onClick={() => void handleSaveChanges()}
          >
            {isSaving ? (
              'Saving changes...'
            ) : isDirty ? (
              <>
                <span className="liturgy-save-dot" aria-hidden="true" />
                Save changes
              </>
            ) : (
              'All saved'
            )}
          </button>
        </div>
      </div>

      {/* Save Message / Feedback Alert */}
      {saveMessage && (
        <div
          className={`liturgy-feedback-alert ${
            saveMessage.type === 'error'
              ? 'liturgy-feedback-alert--error'
              : 'liturgy-feedback-alert--success'
          }`}
        >
          <span>{saveMessage.text}</span>
          <button
            type="button"
            className="liturgy-feedback-close"
            onClick={() => setSaveMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Resources listed one after the other */}
      <div className="liturgy-cms__resources-container">
        <div className="liturgy-cms__resources-header">
          <h2>Resources in this folder</h2>
          <span className="liturgy-cms__resources-count">
            {folder.resources.filter(r => !deletedResourceIds.has(r.id)).length +
              newResources.length}{' '}
            total
          </span>
        </div>

        <div className="liturgy-resource-stack">
          {/* Existing resources */}
          {folder.resources.map((resource, index) => {
            const isMarkedDelete = deletedResourceIds.has(resource.id)
            const currentTitle = existingTitles[resource.id] ?? resource.title
            const replacementFile = replacementPdfs[resource.id]

            return (
              <div
                key={resource.id}
                className={`liturgy-resource-item ${
                  isMarkedDelete ? 'liturgy-resource-item--deleted' : ''
                }`}
              >
                <div className="liturgy-resource-item__num" aria-hidden="true">
                  {index + 1}
                </div>

                {/* Resource editable on the spot (Name + PDF) */}
                <div className="liturgy-resource-item__content">
                  {/* Name Input */}
                  <div className="liturgy-resource-field">
                    <label
                      htmlFor={`resource-title-${resource.id}`}
                      className="liturgy-resource-field__label"
                    >
                      Resource Name
                    </label>
                    <input
                      id={`resource-title-${resource.id}`}
                      className="input liturgy-resource-title-input"
                      value={currentTitle}
                      disabled={isMarkedDelete}
                      placeholder="e.g. Holy Qurbono Malayalam Text"
                      onChange={e => {
                        setExistingTitles(prev => ({ ...prev, [resource.id]: e.target.value }))
                        setSaveMessage(null)
                      }}
                    />
                  </div>

                  {/* PDF Section */}
                  <div className="liturgy-resource-field">
                    <span className="liturgy-resource-field__label">Attached PDF</span>
                    <div className="liturgy-resource-pdf-controls">
                      {/* Current PDF Link */}
                      <a
                        href={resource.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="liturgy-pdf-link"
                        title="Open PDF in new tab"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M10 13v-2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2" />
                        </svg>
                        <span>View current PDF</span>
                        <span className="liturgy-ext-arrow">↗</span>
                      </a>

                      {/* Replace PDF trigger */}
                      <label className="liturgy-pdf-replace-label">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          disabled={isMarkedDelete}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setReplacementPdfs(prev => ({ ...prev, [resource.id]: file }))
                              setSaveMessage(null)
                            }
                          }}
                        />
                        <span className="button button--outline button--sm">
                          {replacementFile ? 'Change replacement' : 'Replace PDF'}
                        </span>
                      </label>

                      {replacementFile && (
                        <div className="liturgy-replacement-pill">
                          <span className="liturgy-replacement-text">
                            New: {replacementFile.name} ({(replacementFile.size / 1024).toFixed(0)} KB)
                          </span>
                          <button
                            type="button"
                            className="liturgy-replacement-clear"
                            title="Cancel replacement"
                            onClick={() => {
                              setReplacementPdfs(prev => {
                                const next = { ...prev }
                                delete next[resource.id]
                                return next
                              })
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete / Undo delete button */}
                <div className="liturgy-resource-item__actions">
                  <button
                    type="button"
                    className={`button button--sm ${
                      isMarkedDelete ? 'button--outline' : 'liturgy-btn-delete-row'
                    }`}
                    onClick={() => handleToggleDeleteResource(resource.id)}
                    title={isMarkedDelete ? 'Restore resource' : 'Delete resource'}
                  >
                    {isMarkedDelete ? 'Undo delete' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}

          {/* New pending resources (added on the spot) */}
          {newResources.map((item, index) => {
            const overallIndex =
              folder.resources.filter(r => !deletedResourceIds.has(r.id)).length + index + 1

            return (
              <div
                key={item.tempId}
                className="liturgy-resource-item liturgy-resource-item--new"
              >
                <div className="liturgy-resource-item__num liturgy-resource-item__num--new" aria-hidden="true">
                  {overallIndex}
                </div>

                <div className="liturgy-resource-item__content">
                  {/* Title input */}
                  <div className="liturgy-resource-field">
                    <label
                      htmlFor={`new-title-${item.tempId}`}
                      className="liturgy-resource-field__label"
                    >
                      Resource Name <span className="liturgy-field-required">*</span>
                    </label>
                    <input
                      id={`new-title-${item.tempId}`}
                      ref={index === newResources.length - 1 ? newResourceTitleInputRef : undefined}
                      className="input liturgy-resource-title-input"
                      placeholder="e.g. Order of the Holy Qurbono"
                      value={item.title}
                      onChange={e => {
                        handleUpdatePendingResource(item.tempId, { title: e.target.value })
                        setSaveMessage(null)
                      }}
                    />
                  </div>

                  {/* PDF Upload File Picker */}
                  <div className="liturgy-resource-field">
                    <span className="liturgy-resource-field__label">
                      Attach PDF File <span className="liturgy-field-required">*</span>
                    </span>
                    <div className="liturgy-resource-pdf-controls">
                      <label className="liturgy-pdf-upload-btn">
                        <input
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          onChange={e => {
                            const file = e.target.files?.[0] ?? null
                            handleUpdatePendingResource(item.tempId, { file })
                            setSaveMessage(null)
                          }}
                        />
                        <span className="button button--outline button--sm">
                          {item.file ? 'Change PDF file' : 'Select PDF file'}
                        </span>
                      </label>

                      {item.file ? (
                        <span className="liturgy-selected-file">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {item.file.name} ({(item.file.size / 1024).toFixed(0)} KB)
                        </span>
                      ) : (
                        <span className="liturgy-empty-file-hint">No file chosen yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove draft row */}
                <div className="liturgy-resource-item__actions">
                  <button
                    type="button"
                    className="liturgy-btn-delete-row"
                    onClick={() => handleRemovePendingResource(item.tempId)}
                    title="Remove this pending row"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}

          {/* Empty state when folder has 0 resources and 0 new pending */}
          {folder.resources.length === 0 && newResources.length === 0 && (
            <div className="liturgy-empty-resources">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="liturgy-cms__empty-icon"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <h3>No resources in this folder yet</h3>
              <p>Click the <strong>+ Add resource</strong> button top right to add your first liturgical PDF.</p>
              <button
                type="button"
                className="button button--primary button--sm"
                onClick={handleAddResourceRow}
              >
                + Add resource
              </button>
            </div>
          )}
        </div>

        {/* Optional Add resource link at the bottom of the list */}
        {(folder.resources.length > 0 || newResources.length > 0) && (
          <div className="liturgy-cms__bottom-bar">
            <button
              type="button"
              className="button button--outline button--sm"
              onClick={handleAddResourceRow}
            >
              + Add another resource
            </button>
            {isDirty && (
              <span className="liturgy-unsaved-hint">
                You have unsaved changes. Remember to click <strong>Save changes</strong> at the top right.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
