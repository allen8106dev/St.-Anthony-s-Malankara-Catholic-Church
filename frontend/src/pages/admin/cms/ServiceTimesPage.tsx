import { useState } from 'react'
import { useAdminServiceTimes, useCreateServiceTime, useUpdateServiceTime, useDeleteServiceTime } from '../../../hooks/useCms'
import { ConfirmDialog } from '../../../components/admin/AdminShared'
import { Field } from '../../../components/admin/CmsShared'
import type { CmsServiceTime, ServiceTimePayload } from '../../../types/cms'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function ServiceTimeRow({
  st, onEdit, onDelete,
}: { st: CmsServiceTime; onEdit: (st: CmsServiceTime) => void; onDelete: (id: string) => void }) {
  return (
    <tr>
      <td>{DAYS[st.day_of_week]}</td>
      <td>{st.service_name}</td>
      <td>{st.start_time}{st.end_time ? ` – ${st.end_time}` : ''}</td>
      <td>{st.location ?? '—'}</td>
      <td>
        <span className={`cms-status-badge ${st.is_active ? 'cms-status--published' : 'cms-status--archived'}`}>
          {st.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div className="actions">
          <button className="button button--ghost" style={{ fontSize: '.82rem' }} onClick={() => onEdit(st)}>Edit</button>
          <button className="button button--ghost" style={{ fontSize: '.82rem', color: '#a0332b' }} onClick={() => onDelete(st.id)}>Delete</button>
        </div>
      </td>
    </tr>
  )
}

const EMPTY: ServiceTimePayload = {
  day_of_week: 0, start_time: '', service_name: '', location: '',
  description: '', sort_order: 0, is_active: true,
}

export function ServiceTimesPage() {
  const { data: serviceTimes, isLoading } = useAdminServiceTimes()
  const createSt = useCreateServiceTime()
  const updateSt = useUpdateServiceTime()
  const deleteSt = useDeleteServiceTime()

  const [editing, setEditing] = useState<CmsServiceTime | null>(null)
  const [form, setForm] = useState<ServiceTimePayload>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [error, setError] = useState('')

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(st: CmsServiceTime) {
    setEditing(st)
    setForm({
      day_of_week: st.day_of_week, start_time: st.start_time,
      end_time: st.end_time ?? '', service_name: st.service_name,
      location: st.location ?? '', description: st.description ?? '',
      sort_order: st.sort_order, is_active: st.is_active,
    })
    setShowForm(true)
  }

  function set(field: keyof ServiceTimePayload, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, end_time: form.end_time || null, location: form.location || null, description: form.description || null }
      if (editing) {
        await updateSt.mutateAsync({ id: editing.id, data: payload })
      } else {
        await createSt.mutateAsync(payload)
      }
      setShowForm(false)
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

      <div className="admin-table-wrap">
        <table className="admin-table" aria-label="Service times">
          <thead><tr>
            <th>Day</th><th>Service</th><th>Time</th><th>Location</th><th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6}><p role="status" style={{ padding: '1rem' }}>Loading…</p></td></tr>}
            {!isLoading && serviceTimes?.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><p>No service times yet.</p></div></td></tr>
            )}
            {serviceTimes?.map(st => (
              <ServiceTimeRow key={st.id} st={st} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="confirm-dialog" role="dialog" aria-modal="true" aria-label="Service time form">
          <div className="confirm-dialog__panel" style={{ width: 'min(100%, 36rem)' }}>
            <h2>{editing ? 'Edit Service Time' : 'New Service Time'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <Field label="Service name *">
                  <input value={form.service_name} onChange={e => set('service_name', e.target.value)} required maxLength={200} className="admin-form-input" />
                </Field>
                <Field label="Day of week">
                  <select value={form.day_of_week} onChange={e => set('day_of_week', parseInt(e.target.value))} className="admin-form-input">
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </Field>
                <div className="admin-form-row">
                  <Field label="Start time *">
                    <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} required className="admin-form-input" />
                  </Field>
                  <Field label="End time">
                    <input type="time" value={form.end_time ?? ''} onChange={e => set('end_time', e.target.value)} className="admin-form-input" />
                  </Field>
                </div>
                <Field label="Location">
                  <input value={form.location ?? ''} onChange={e => set('location', e.target.value)} maxLength={250} className="admin-form-input" />
                </Field>
                <Field label="Description">
                  <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={2} className="admin-form-input" />
                </Field>
                <div className="admin-form-row">
                  <Field label="Sort order">
                    <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} min={0} className="admin-form-input" />
                  </Field>
                  <Field label="Active">
                    <select value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')} className="admin-form-input">
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>
              {error && <p className="admin-form-error" role="alert">{error}</p>}
              <div className="confirm-dialog__actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="button button--outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={createSt.isPending || updateSt.isPending}>
                  {createSt.isPending || updateSt.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete service time?"
          message="This service time will be permanently removed."
          confirmLabel="Delete"
          onConfirm={() => void deleteSt.mutateAsync(deleteTarget).then(() => setDeleteTarget(null))}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
