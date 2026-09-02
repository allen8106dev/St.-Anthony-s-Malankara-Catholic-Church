import { useEffect, useState } from 'react'
import { useFamilies } from '../../hooks/useMembers'
import type { MemberCreatePayload, MemberDetail, MembershipStatus } from '../../types/members'

const STATUSES: MembershipStatus[] = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED', 'OTHER']

interface Props {
  initial?: Partial<MemberDetail>
  onSubmit: (payload: MemberCreatePayload) => Promise<void>
  submitLabel: string
  serverError?: string
}

export function MemberForm({ initial, onSubmit, submitLabel, serverError }: Props) {
  const { data: familiesData } = useFamilies({ page_size: 100 })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<MemberCreatePayload>({
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    middle_name: initial?.middle_name ?? '',
    date_of_birth: initial?.date_of_birth ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    address: initial?.address ?? '',
    membership_status: initial?.membership_status ?? 'ACTIVE',
    date_joined: initial?.date_joined ?? '',
    notes: initial?.notes ?? '',
    family_id: initial?.family_id ?? '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        first_name: initial.first_name ?? '',
        last_name: initial.last_name ?? '',
        middle_name: initial.middle_name ?? '',
        date_of_birth: initial.date_of_birth ?? '',
        phone: initial.phone ?? '',
        email: initial.email ?? '',
        address: initial.address ?? '',
        membership_status: initial.membership_status ?? 'ACTIVE',
        date_joined: initial.date_joined ?? '',
        notes: initial.notes ?? '',
        family_id: initial.family_id ?? '',
      })
    }
  }, [initial?.id])

  function set(field: keyof MemberCreatePayload, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required.'
    if (!form.last_name.trim()) e.last_name = 'Last name is required.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate() || busy) return
    setBusy(true)
    try {
      const payload: MemberCreatePayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      }
      if (form.middle_name?.trim()) payload.middle_name = form.middle_name.trim()
      if (form.date_of_birth) payload.date_of_birth = form.date_of_birth
      if (form.phone?.trim()) payload.phone = form.phone.trim()
      if (form.email?.trim()) payload.email = form.email.trim()
      if (form.address?.trim()) payload.address = form.address.trim()
      if (form.membership_status) payload.membership_status = form.membership_status
      if (form.date_joined) payload.date_joined = form.date_joined
      if (form.notes?.trim()) payload.notes = form.notes.trim()
      if (form.family_id) payload.family_id = form.family_id
      await onSubmit(payload)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-form-row">
        <label>
          First name <span aria-hidden="true">*</span>
          <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} aria-required="true" aria-describedby={errors.first_name ? 'err-first' : undefined} />
          {errors.first_name && <span id="err-first" className="admin-form-error" role="alert">{errors.first_name}</span>}
        </label>
        <label>
          Last name <span aria-hidden="true">*</span>
          <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} aria-required="true" aria-describedby={errors.last_name ? 'err-last' : undefined} />
          {errors.last_name && <span id="err-last" className="admin-form-error" role="alert">{errors.last_name}</span>}
        </label>
      </div>
      <label>
        Middle name
        <input value={form.middle_name ?? ''} onChange={(e) => set('middle_name', e.target.value)} />
      </label>
      <div className="admin-form-row">
        <label>
          Date of birth
          <input type="date" value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value)} />
        </label>
        <label>
          Date joined
          <input type="date" value={form.date_joined ?? ''} onChange={(e) => set('date_joined', e.target.value)} />
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          Phone
          <input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} aria-describedby={errors.email ? 'err-email' : undefined} />
          {errors.email && <span id="err-email" className="admin-form-error" role="alert">{errors.email}</span>}
        </label>
      </div>
      <label>
        Address
        <textarea rows={2} value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
      </label>
      <div className="admin-form-row">
        <label>
          Membership status
          <select value={form.membership_status} onChange={(e) => set('membership_status', e.target.value as MembershipStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label>
          Family
          <select value={form.family_id ?? ''} onChange={(e) => set('family_id', e.target.value)}>
            <option value="">— No family —</option>
            {familiesData?.items.map((f) => <option key={f.id} value={f.id}>{f.family_name}</option>)}
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
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
