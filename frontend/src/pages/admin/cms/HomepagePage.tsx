import { useEffect, useState } from 'react'
import { useAdminPageContent, useUpsertPageContent } from '../../../hooks/useCms'
import { Field, UnsavedBanner } from '../../../components/admin/CmsShared'
import { ImageUploader } from '../../../components/admin/ImageUploader'
import type { PageContent, PageContentPayload } from '../../../types/cms'

const PAGE = 'homepage'

const SECTIONS: { key: string; label: string; fields: { field: keyof PageContentPayload; label: string; helper?: string; type?: 'textarea' | 'url' }[] }[] = [
  {
    key: 'hero', label: 'Hero',
    fields: [
      { field: 'heading', label: 'Heading', helper: 'Main headline displayed in the hero.' },
      { field: 'body', label: 'Description', type: 'textarea', helper: 'Short introductory text below the heading.' },
      { field: 'image_url', label: 'Hero Image', type: 'url', helper: 'Upload background image for the hero section.' },
    ],
  },
  {
    key: 'intro', label: 'Introduction',
    fields: [
      { field: 'heading', label: 'Heading' },
      { field: 'body', label: 'Body text', type: 'textarea' },
    ],
  },
  {
    key: 'visit', label: 'Visit Us',
    fields: [
      { field: 'heading', label: 'Heading' },
      { field: 'body', label: 'Description / address', type: 'textarea', helper: 'Address, directions, and contact information.' },
      { field: 'image_url', label: 'Map or Location Image', type: 'url', helper: 'Upload location or map illustration.' },
    ],
  },
  {
    key: 'cta', label: 'Call to Action',
    fields: [
      { field: 'heading', label: 'Heading' },
      { field: 'body', label: 'Supporting text', type: 'textarea' },
    ],
  },
]

function SectionEditor({
  sectionDef,
  existing,
  onSave,
  saving,
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
    status: existing?.status ?? 'PUBLISHED',
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
          f.field === 'image_url' ? (
            <ImageUploader
              key={f.field}
              value={(form[f.field] as string) ?? ''}
              onChange={val => set(f.field, val)}
              label={f.label}
              helper={f.helper ?? 'Upload image (JPG, PNG, WebP, GIF, max 5 MB)'}
            />
          ) : (
            <Field key={f.field} label={f.label} helper={f.helper}>
              {f.type === 'textarea' ? (
                <textarea value={(form[f.field] as string) ?? ''} onChange={e => set(f.field, e.target.value)} rows={3} />
              ) : (
                <input value={(form[f.field] as string) ?? ''} onChange={e => set(f.field, e.target.value)} maxLength={300} />
              )}
            </Field>
          )
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

export function HomepagePage() {
  const { data: sections, isLoading } = useAdminPageContent(PAGE)
  const upsert = useUpsertPageContent(PAGE)
  const [globalDirty] = useState(false)

  const sectionMap = Object.fromEntries((sections ?? []).map(s => [s.section, s]))

  async function handleSave(section: string, data: PageContentPayload) {
    await upsert.mutateAsync({ section, data: { ...data, status: 'PUBLISHED' } })
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Homepage</h1>
          <p>Edit the content displayed on the public homepage</p>
        </div>
      </div>

      <UnsavedBanner dirty={globalDirty} />

      <div className="cms-page-editor">
        {SECTIONS.map(s => (
          <SectionEditor
            key={s.key}
            sectionDef={s}
            existing={sectionMap[s.key]}
            onSave={handleSave}
            saving={upsert.isPending}
          />
        ))}
      </div>
    </div>
  )
}
