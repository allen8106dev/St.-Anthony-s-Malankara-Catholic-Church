import { useState } from 'react'
import { useAdminServiceTimes, useCreateServiceTime, useUpdateServiceTime, useDeleteServiceTime } from '../../../hooks/useCms'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import { Field } from '../../../components/admin/CmsShared'
import { LoadingState } from '../../../components/ui/Feedback'
import type { CmsServiceTime, ServiceTimePayload, ServiceTimeStatus } from '../../../types/cms'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const STATUSES: { value: ServiceTimeStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const EMPTY: ServiceTimePayload = {
  day_of_week: 0, start_time: '', service_name: '', status: 'ACTIVE',
}

function toTimeInput(value: string) {
  return value ? value.slice(0, 5) : ''
}

function formatTime(value: string) {
  const [hourStr, minuteStr] = value.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = ((hour + 11) % 12) + 1
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`
}

function statusClass(status: ServiceTimeStatus) {
  if (status === 'ACTIVE') return 'cms-status--published'
  if (status === 'CANCELLED') return 'cms-status--archived'
  return 'cms-status--draft'
}

function ServiceTimeForm({
  form, set, error, onSave, onCancel, onDelete, saving,
}: {
  form: ServiceTimePayload
  set: (field: keyof ServiceTimePayload, value: string | number) => void
  error: string
  onSave: (e: React.FormEvent) => void
  onCancel: () => void
  onDelete?: () => void
  saving: boolean
}) {
  return (
    <form className="st-card__form" onSubmit={onSave} onClick={e => e.stopPropagation()}>
      <Field label="Service name *">
        <input value={form.service_name} onChange={e => set('service_name', e.target.value)} required maxLength={200} className="admin-form-input" />
      </Field>
      <Field label="Day of week">
        <select value={form.day_of_week} onChange={e => set('day_of_week', parseInt(e.target.value, 10))} className="admin-form-input">
          {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
      </Field>
      <div className="admin-form-row">
        <Field label="Start time *">
          <input type="time" value={toTimeInput(form.start_time)} onChange={e => set('start_time', e.target.value)} required className="admin-form-input" />
        </Field>
        <Field label="End time">
          <input type="time" value={toTimeInput(form.end_time ?? '')} onChange={e => set('end_time', e.target.value)} className="admin-form-input" />
        </Field>
      </div>
      <Field label="Status">
        <select value={form.status} onChange={e => set('status', e.target.value)} className="admin-form-input">
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <div className="st-card__actions">
        {onDelete && (
          <button type="button" className="button button--ghost" style={{ color: '#a0332b' }} onClick={onDelete}>Delete</button>
        )}
        <button type="button" className="button button--outline" onClick={onCancel}>Close</button>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export function ServiceTimesPage() {
  const { data: serviceTimes, isLoading } = useAdminServiceTimes()
  const createSt = useCreateServiceTime()
  const updateSt = useUpdateServiceTime()
  const deleteSt = useDeleteServiceTime()

  const [openId, setOpenId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ServiceTimePayload>(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState('')

  function openNew() {
    setError('')
    setForm(EMPTY)
    setOpenId('new')
  }

  function toggleEdit(st: CmsServiceTime) {
    setError('')
    if (openId === st.id) {
      setOpenId(null)
      return
    }
    setForm({
      day_of_week: st.day_of_week,
      start_time: toTimeInput(st.start_time),
      end_time: st.end_time ? toTimeInput(st.end_time) : '',
      service_name: st.service_name,
      status: st.status,
    })
    setOpenId(st.id)
  }

  function set(field: keyof ServiceTimePayload, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const payload: ServiceTimePayload = {
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time || null,
      service_name: form.service_name,
      status: form.status,
    }
    try {
      if (openId && openId !== 'new') {
        await updateSt.mutateAsync({ id: openId, data: payload })
      } else {
        await createSt.mutateAsync(payload)
      }
      setOpenId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Service Times</h1><p>Manage public service schedule</p></div>
        <button className="button button--primary" onClick={openNew}>+ Add Service Time</button>
      </div>

      {isLoading && <LoadingState text="Loading service times…" />}

      {!isLoading && (
        <div className="st-list">
          {openId === 'new' && (
            <article className="st-card st-card--open">
              <div className="st-card__head st-card__head--static">
                <strong>New service time</strong>
              </div>
              <div className="st-card__body">
                <ServiceTimeForm
                  form={form}
                  set={set}
                  error={error}
                  onSave={handleSave}
                  onCancel={() => setOpenId(null)}
                  saving={createSt.isPending}
                />
              </div>
            </article>
          )}

          {serviceTimes?.length === 0 && openId !== 'new' && (
            <div className="admin-empty"><p>No service times yet.</p></div>
          )}

          {serviceTimes?.map(st => {
            const open = openId === st.id
            return (
              <article key={st.id} className={`st-card ${open ? 'st-card--open' : ''}`}>
                <button type="button" className="st-card__head" onClick={() => toggleEdit(st)} aria-expanded={open}>
                  <span>
                    <strong>{st.service_name}</strong>
                    <span className="st-card__meta">{DAYS[st.day_of_week]} · {formatTime(st.start_time)}{st.end_time ? ` – ${formatTime(st.end_time)}` : ''}</span>
                  </span>
                  <span className={`cms-status-badge ${statusClass(st.status)}`}>
                    {STATUSES.find(s => s.value === st.status)?.label ?? st.status}
                  </span>
                </button>
                {open && (
                  <div className="st-card__body">
                    <ServiceTimeForm
                      form={form}
                      set={set}
                      error={error}
                      onSave={handleSave}
                      onCancel={() => setOpenId(null)}
                      onDelete={() => setDeleteTarget(st.id)}
                      saving={updateSt.isPending}
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete service time?"
          message="This service time will be permanently removed."
          confirmLabel="Delete"
          onConfirm={() => void deleteSt.mutateAsync(deleteTarget).then(() => { setDeleteTarget(null); setOpenId(null) })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
