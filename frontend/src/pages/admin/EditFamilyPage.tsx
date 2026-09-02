import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FamilyForm } from '../../components/admin/FamilyForm'
import { useFamily, useUpdateFamily } from '../../hooks/useMembers'
import type { FamilyCreatePayload } from '../../types/members'

export function EditFamilyPage() {
  const { familyId } = useParams<{ familyId: string }>()
  const navigate = useNavigate()
  const { data: family, isLoading, isError } = useFamily(familyId)
  const { mutateAsync } = useUpdateFamily(familyId!)
  const [serverError, setServerError] = useState('')

  if (isLoading) return <div className="admin-section"><div className="admin-skeleton" style={{ height: '14rem' }} /></div>
  if (isError || !family) return (
    <div>
      <p role="alert" style={{ color: '#a0332b' }}>Family not found.</p>
      <Link to="/admin/families" className="button button--outline" style={{ marginTop: '1rem' }}>Back to Families</Link>
    </div>
  )

  async function handleSubmit(payload: FamilyCreatePayload) {
    setServerError('')
    try {
      await mutateAsync(payload)
      navigate(`/admin/families/${familyId}`, { replace: true, state: { updated: true } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to update family.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/families">Families</Link> / <Link to={`/admin/families/${familyId}`}>{family.family_name}</Link> / Edit
          </p>
          <h1>Edit Family</h1>
        </div>
      </div>
      <div className="admin-section" style={{ maxWidth: '42rem' }}>
        <FamilyForm initial={family} onSubmit={handleSubmit} submitLabel="Save Changes" serverError={serverError} />
      </div>
    </div>
  )
}
