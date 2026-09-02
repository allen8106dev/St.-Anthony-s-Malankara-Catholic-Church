import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateDue } from '../../../hooks/useFinance'
import { useFamilies, useMembers } from '../../../hooks/useMembers'

const DUE_TYPES = [
  { value: 'ANNUAL_MEMBERSHIP', label: 'Annual Membership Dues' },
  { value: 'FEAST_CONTRIBUTION', label: 'Parish Feast Contribution' },
  { value: 'BUILDING_FUND', label: 'Building / Renovation Fund' },
  { value: 'MAINTENANCE', label: 'Parish Maintenance' },
  { value: 'SUNDAY_SCHOOL', label: 'Sunday School / Youth Dues' },
  { value: 'CHARITY', label: 'Charity / Mission Support' },
  { value: 'OTHER', label: 'Other' },
]

export function CreateDuePage() {
  const navigate = useNavigate()
  const createDue = useCreateDue()

  const { data: familiesData } = useFamilies({ page_size: 100 })
  const { data: membersData } = useMembers({ page_size: 100 })

  const [ownerType, setOwnerType] = useState<'family' | 'member'>('family')
  const [familyId, setFamilyId] = useState('')
  const [memberId, setMemberId] = useState('')

  const [title, setTitle] = useState('')
  const [dueType, setDueType] = useState('ANNUAL_MEMBERSHIP')
  const [customDueType, setCustomDueType] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (ownerType === 'family' && !familyId) {
      setError('Please select a family.')
      return
    }
    if (ownerType === 'member' && !memberId) {
      setError('Please select a member.')
      return
    }
    if (!title.trim()) {
      setError('Please enter a due title.')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid due amount greater than 0.')
      return
    }

    const finalDueType = dueType === 'OTHER' ? customDueType.trim() || 'OTHER' : dueType

    try {
      const created = await createDue.mutateAsync({
        family_id: ownerType === 'family' ? familyId : null,
        member_id: ownerType === 'member' ? memberId : null,
        title: title.trim(),
        due_type: finalDueType,
        amount: numAmount.toFixed(2),
        due_date: dueDate || null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        description: description.trim() || null,
      })
      navigate(`/admin/finance/dues/${created.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create church due. Please verify the input.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link to="/admin/finance/dues" className="button button--ghost" style={{ fontSize: '.85rem', marginBottom: '.5rem' }}>
            ← Back to Dues
          </Link>
          <h1>Create Church Due</h1>
          <p>Assign a new due obligation to a family or individual member</p>
        </div>
      </div>

      <div className="admin-section" style={{ maxWidth: '44rem' }}>
        {error && (
          <div className="admin-form-error" style={{ marginBottom: '1.25rem', padding: '.75rem', background: '#fdf2f2', border: '1px solid #f8d7da' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Assignment Type */}
          <div>
            <label style={{ marginBottom: '.5rem', display: 'block', fontWeight: 600 }}>Assign Due To:</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownerType"
                  value="family"
                  checked={ownerType === 'family'}
                  onChange={() => setOwnerType('family')}
                />
                Family Unit
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownerType"
                  value="member"
                  checked={ownerType === 'member'}
                  onChange={() => setOwnerType('member')}
                />
                Individual Member
              </label>
            </div>
          </div>

          {ownerType === 'family' ? (
            <label>
              Family *
              <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} required>
                <option value="">Select a family…</option>
                {familiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.family_name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Member *
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">Select an active member…</option>
                {membersData?.items.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} {m.family_name ? `(${m.family_name})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Due Title *
            <input
              type="text"
              placeholder="e.g. 2026 Annual Membership Subscription"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
              Amount (₹) *
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="2000.00"
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
              placeholder="Optional details, instructions or references regarding this due…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="button button--primary" disabled={createDue.isPending}>
              {createDue.isPending ? 'Creating Due…' : 'Create Due'}
            </button>
            <Link to="/admin/finance/dues" className="button button--outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

