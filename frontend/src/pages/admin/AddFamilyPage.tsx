import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FamilyForm } from '../../components/admin/FamilyForm'
import { useCreateFamily } from '../../hooks/useMembers'
import type { FamilyCreatePayload } from '../../types/members'

export function AddFamilyPage() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateFamily()
  const [serverError, setServerError] = useState('')

  async function handleSubmit(payload: FamilyCreatePayload) {
    setServerError('')
    try {
      const family = await mutateAsync(payload)
      navigate(`/admin/families/${family.id}`, { replace: true, state: { created: true } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create family.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/families">Families</Link> / Add
          </p>
          <h1>Add Family</h1>
        </div>
      </div>
      <div className="admin-section" style={{ maxWidth: '42rem' }}>
        <FamilyForm onSubmit={handleSubmit} submitLabel="Create Family" serverError={serverError} />
      </div>
    </div>
  )
}
