import { useEffect, useState } from 'react'
import type { FamilyCreatePayload, FamilyDetail } from '../../types/members'

interface Props {
  initial?: Partial<FamilyDetail>
  onSubmit: (payload: FamilyCreatePayload) => Promise<void>
  submitLabel: string
  serverError?: string
}

export function FamilyForm({ initial, onSubmit, submitLabel, serverError }: Props) {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ family_name: '', address: '', notes: '' })

  useEffect(() => {
    if (initial) setForm({ family_name: initial.family_name ?? '', address: initial.address ?? '', notes: initial.notes ?? '' })
  }, [initial?.id])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.family_name.trim()) e.family_name = 'Family name is required.'
    setErrors(e)
    if (Object.keys(e).length || busy) return
    setBusy(true)
    try {
      const payload: FamilyCreatePayload = { family_name: form.family_name.trim() }
      if (form.address.trim()) payload.address = form.address.trim()
      if (form.notes.trim()) payload.notes = form.notes.trim()
      await onSubmit(payload)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <label>
        Family name <span aria-hidden="true">*</span>
        <input value={form.family_name} onChange={(e) => set('family_name', e.target.value)} aria-required="true" aria-describedby={errors.family_name ? 'err-fname' : undefined} />
        {errors.family_name && <span id="err-fname" className="admin-form-error" role="alert">{errors.family_name}</span>}
      </label>
      <label>
        Address
        <textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
      </label>
      <label>
        Notes
        <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </label>
      {serverError && <p className="admin-form-error" role="alert">{serverError}</p>}
      <div className="admin-form-actions">
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
