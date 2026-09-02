import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDue, useUpdateDue } from '../../../hooks/useFinance'
import { DueStatusBadge } from '../../../components/admin/FinanceBadge'

const DUE_TYPES = [
  { value: 'ANNUAL_MEMBERSHIP', label: 'Annual Membership Dues' },
  { value: 'FEAST_CONTRIBUTION', label: 'Parish Feast Contribution' },
  { value: 'BUILDING_FUND', label: 'Building / Renovation Fund' },
  { value: 'MAINTENANCE', label: 'Parish Maintenance' },
  { value: 'SUNDAY_SCHOOL', label: 'Sunday School / Youth Dues' },
  { value: 'CHARITY', label: 'Charity / Mission Support' },
  { value: 'OTHER', label: 'Other' },
]

export function EditDuePage() {
  const { dueId } = useParams<{ dueId: string }>()
  const navigate = useNavigate()
  const { data: due, isLoading, isError } = useDue(dueId)
  const updateDue = useUpdateDue(dueId ?? '')

  const [title, setTitle] = useState('')
  const [dueType, setDueType] = useState('ANNUAL_MEMBERSHIP')
  const [customDueType, setCustomDueType] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (due) {
      setTitle(due.title)
      const matchedType = DUE_TYPES.find((t) => t.value === due.due_type)
      if (matchedType) {
        setDueType(due.due_type ?? 'OTHER')
      } else if (due.due_type) {
        setDueType('OTHER')
        setCustomDueType(due.due_type)
      }
      setAmount(due.amount)
      setDueDate(due.due_date ?? '')
      setPeriodStart(due.period_start ?? '')
      setPeriodEnd(due.period_end ?? '')
      setDescription(due.description ?? '')
    }
  }, [due])

  if (isLoading) {
    return <div className="admin-skeleton" style={{ height: '20rem' }} />
  }

  if (isError || !due) {
    return (
      <div className="admin-section">
        <h2>Due Not Found</h2>
        <Link to="/admin/finance/dues" className="button button--outline">
          ← Back to Dues
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!due) return

    if (!title.trim()) {
      setError('Please enter a due title.')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }
    const alreadyPaid = parseFloat(due.amount_paid ?? '0')
    if (numAmount < alreadyPaid) {
      setError(`Amount cannot be reduced below the collected amount of ₹${alreadyPaid.toFixed(2)}.`)
      return
    }

    const finalDueType = dueType === 'OTHER' ? customDueType.trim() || 'OTHER' : dueType

    try {
      await updateDue.mutateAsync({
        title: title.trim(),
        due_type: finalDueType,
        amount: numAmount.toFixed(2),
        due_date: dueDate || null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        description: description.trim() || null,
      })
      navigate(`/admin/finance/dues/${due.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to update due.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem' }}>
            <Link to={`/admin/finance/dues/${due.id}`} className="button button--ghost" style={{ fontSize: '.85rem' }}>
              ← Back to Detail
            </Link>
            <DueStatusBadge status={due.status} />
          </div>
          <h1>Edit Due: {due.title}</h1>
          <p>
            Recipient: <strong>{due.member_name ?? (due.family_name ? `${due.family_name} (Family)` : '—')}</strong>
          </p>
        </div>
      </div>

      <div className="admin-section" style={{ maxWidth: '44rem' }}>
        {error && (
          <div className="admin-form-error" style={{ marginBottom: '1.25rem', padding: '.75rem', background: '#fdf2f2', border: '1px solid #f8d7da' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Due Title *
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <div className="admin-form-row">
            <label>
              Due Category / Type
              <select value={dueType} onChange={(e) => setDueType(e.target.value)}>
                {DUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {dueType === 'OTHER' && (
              <label>
                Custom Due Type
                <input
                  type="text"
                  placeholder="Specify type…"
                  value={customDueType}
                  onChange={(e) => setCustomDueType(e.target.value)}
                />
              </label>
            )}

            <label>
              Total Amount (₹) *
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="admin-form-row">
            <label>
              Due Date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
              <label>
                Period Start
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </label>
              <label>
                Period End
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </label>
            </div>
          </div>

          <label>
            Notes / Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={updateDue.isPending}>
              {updateDue.isPending ? 'Saving Changes…' : 'Save Changes'}
            </button>
            <Link to={`/admin/finance/dues/${due.id}`} className="button button--outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
