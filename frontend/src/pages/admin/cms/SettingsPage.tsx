import { useEffect, useState } from 'react'
import { useAdminSettings, useUpsertSetting } from '../../../hooks/useCms'
import { FormSection, Field } from '../../../components/admin/CmsShared'

const SETTING_DEFS: { key: string; label: string; helper?: string; type?: 'url' }[] = [
  { key: 'church_name', label: 'Church name', helper: 'Full official name of the parish.' },
  { key: 'tagline', label: 'Tagline', helper: 'Short phrase displayed in the footer and meta.' },
  { key: 'phone', label: 'Phone number' },
  { key: 'email', label: 'Email address' },
  { key: 'address', label: 'Address', helper: 'Full postal address.' },
  { key: 'office_hours', label: 'Office hours', helper: 'e.g. Mon–Fri 9am–5pm' },
  { key: 'google_maps_url', label: 'Google Maps URL', type: 'url' },
  { key: 'facebook_url', label: 'Facebook URL', type: 'url' },
  { key: 'instagram_url', label: 'Instagram URL', type: 'url' },
  { key: 'youtube_url', label: 'YouTube URL', type: 'url' },
]

export function SettingsPage() {
  const { data: settings, isLoading } = useAdminSettings()
  const upsert = useUpsertSetting()

  const [values, setValues] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {}
      settings.forEach(s => { map[s.key] = s.value })
      setValues(map)
    }
  }, [settings])

  function set(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }))
    setDirty(d => ({ ...d, [key]: true }))
    setSaved(s => ({ ...s, [key]: false }))
  }

  async function handleSave(key: string) {
    setErrors(e => ({ ...e, [key]: '' }))
    try {
      await upsert.mutateAsync({ key, value: values[key] ?? '' })
      setDirty(d => ({ ...d, [key]: false }))
      setSaved(s => ({ ...s, [key]: true }))
    } catch (err: unknown) {
      setErrors(e => ({ ...e, [key]: err instanceof Error ? err.message : 'Failed to save.' }))
    }
  }

  if (isLoading) return <p role="status">Loading…</p>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage public church information displayed on the website</p>
        </div>
      </div>

      <div className="cms-page-editor">
        <FormSection title="Church information">
          {SETTING_DEFS.map(def => (
            <div key={def.key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '.75rem' }}>
              <Field label={def.label} helper={def.helper} error={errors[def.key]}>
                <input
                  type={def.type === 'url' ? 'url' : 'text'}
                  value={values[def.key] ?? ''}
                  onChange={e => set(def.key, e.target.value)}
                  maxLength={2000}
                  style={{ minWidth: '20rem' }}
                />
              </Field>
              <button
                type="button"
                className="button button--primary"
                style={{ marginBottom: errors[def.key] ? '1.4rem' : '0', flexShrink: 0 }}
                disabled={!dirty[def.key] || upsert.isPending}
                onClick={() => void handleSave(def.key)}
              >
                Save
              </button>
              {saved[def.key] && !dirty[def.key] && (
                <span style={{ color: '#1a6b3c', fontSize: '.88rem', marginBottom: '0' }}>✓</span>
              )}
            </div>
          ))}
        </FormSection>
      </div>
    </div>
  )
}
