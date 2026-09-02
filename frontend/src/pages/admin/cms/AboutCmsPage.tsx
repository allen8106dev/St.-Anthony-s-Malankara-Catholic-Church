import { useEffect, useState } from 'react'
import { useAdminPageContent, useUpsertPageContent } from '../../../hooks/useCms'
import { Field } from '../../../components/admin/CmsShared'
import type { PageContent, PageContentPayload } from '../../../types/cms'

const PAGE = 'about'

const SECTIONS = [
  {
    key: 'intro', label: 'Introduction',
    fields: [
      { field: 'heading' as keyof PageContentPayload, label: 'Page title' },
      { field: 'body' as keyof PageContentPayload, label: 'Introduction text', type: 'textarea' as const },
      { field: 'image_url' as keyof PageContentPayload, label: 'Header image URL', type: 'url' as const },
    ],
  },
  {
    key: 'history', label: 'Church History',
    fields: [
      { field: 'heading' as keyof PageContentPayload, label: 'Section heading' },
      { field: 'body' as keyof PageContentPayload, label: 'History text', type: 'textarea' as const },
    ],
  },
  {
    key: 'mission', label: 'Mission & Vision',
    fields: [
      { field: 'heading' as keyof PageContentPayload, label: 'Heading' },
      { field: 'body' as keyof PageContentPayload, label: 'Mission and vision statement', type: 'textarea' as const },
    ],
  },
  {
    key: 'pastor', label: 'Pastor / Priest',
    fields: [
      { field: 'heading' as keyof PageContentPayload, label: 'Name and title' },
      { field: 'body' as keyof PageContentPayload, label: 'Bio / message', type: 'textarea' as const },
      { field: 'image_url' as keyof PageContentPayload, label: 'Photo URL', type: 'url' as const },
    ],
  },
  {
    key: 'contact', label: 'Contact & Location',
    fields: [
      { field: 'heading' as keyof PageContentPayload, label: 'Heading' },
      { field: 'body' as keyof PageContentPayload, label: 'Address, phone, email, directions', type: 'textarea' as const },
      { field: 'image_url' as keyof PageContentPayload, label: 'Map image URL', type: 'url' as const },
    ],
  },
]

function SectionEditor({
  sectionDef, existing, onSave, saving,
}: {
  sectionDef: typeof SECTIONS[0]
  existing: PageContent | undefined
  onSave: (section: string, data: PageContentPayload) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<PageContentPayload>({
    heading: existing?.heading ?? '',
    body: existing?.body ?? '',
    image_url: existing?.image_url ?? '',
    status: 'PUBLISHED',
  })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existing) {
      setForm({ heading: existing.heading ?? '', body: existing.body ?? '', image_url: existing.image_url ?? '', status: existing.status })
      setDirty(false)
    }
  }, [existing])

  function set(field: keyof PageContentPayload, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await onSave(sectionDef.key, { ...form, image_url: form.image_url || null, body: form.body || null, heading: form.heading || null })
    setDirty(false)
    setSaved(true)
  }

  return (
    <div className="cms-form-section">
      <h2 className="cms-form-section__title">{sectionDef.label}</h2>
      <form onSubmit={handleSave}>
        {sectionDef.fields.map(f => (
          <Field key={f.field} label={f.label}>
            {f.type === 'textarea' ? (
              <textarea value={(form[f.field] as string) ?? ''} onChange={e => set(f.field, e.target.value)} rows={4} />
            ) : f.type === 'url' ? (
              <>
                <input type="url" value={(form[f.field] as string) ?? ''} onChange={e => set(f.field, e.target.value)} maxLength={2048} />
                {form[f.field] && (
                  <img src={form[f.field] as string} alt="Preview" className="cms-image-preview" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </>
            ) : (
              <input value={(form[f.field] as string) ?? ''} onChange={e => set(f.field, e.target.value)} maxLength={300} />
            )}
          </Field>
        ))}
        <div className="admin-form-actions" style={{ marginTop: '1rem' }}>
          <button type="submit" className="button button--primary" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save Section'}
          </button>
          {saved && !dirty && <span style={{ color: '#1a6b3c', fontSize: '.88rem' }}>✓ Saved</span>}
        </div>
      </form>
    </div>
  )
}

export function AboutCmsPage() {
  const { data: sections, isLoading } = useAdminPageContent(PAGE)
  const upsert = useUpsertPageContent(PAGE)
  const sectionMap = Object.fromEntries((sections ?? []).map(s => [s.section, s]))

  async function handleSave(section: string, data: PageContentPayload) {
    await upsert.mutateAsync({ section, data: { ...data, status: 'PUBLISHED' } })
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>About Page</h1>
          <p>Edit the content displayed on the public About page</p>
        </div>
      </div>
      <div className="cms-page-editor">
        {SECTIONS.map(s => (
          <SectionEditor key={s.key} sectionDef={s} existing={sectionMap[s.key]} onSave={handleSave} saving={upsert.isPending} />
        ))}
      </div>
    </div>
  )
}
