import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MemberForm } from '../../components/admin/MemberForm'
import { useCreateMember } from '../../hooks/useMembers'
import type { MemberCreatePayload } from '../../types/members'

export function AddMemberPage() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateMember()
  const [serverError, setServerError] = useState('')

  async function handleSubmit(payload: MemberCreatePayload) {
    setServerError('')
    try {
      const member = await mutateAsync(payload)
      navigate(`/admin/members/${member.id}`, { replace: true, state: { created: true } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to create member.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/members">Members</Link> / Add
          </p>
          <h1>Add Member</h1>
        </div>
      </div>
      <div className="admin-section" style={{ maxWidth: '48rem' }}>
        <MemberForm onSubmit={handleSubmit} submitLabel="Create Member" serverError={serverError} />
      </div>
    </div>
  )
}
