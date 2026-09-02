import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MemberForm } from '../../components/admin/MemberForm'
import { useMember, useUpdateMember } from '../../hooks/useMembers'
import type { MemberCreatePayload } from '../../types/members'

export function EditMemberPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { data: member, isLoading, isError } = useMember(memberId)
  const { mutateAsync } = useUpdateMember(memberId!)
  const [serverError, setServerError] = useState('')

  if (isLoading) return <div className="admin-section"><div className="admin-skeleton" style={{ height: '20rem' }} /></div>
  if (isError || !member) return (
    <div>
      <p role="alert" style={{ color: '#a0332b' }}>Member not found.</p>
      <Link to="/admin/members" className="button button--outline" style={{ marginTop: '1rem' }}>Back to Members</Link>
    </div>
  )

  async function handleSubmit(payload: MemberCreatePayload) {
    setServerError('')
    try {
      await mutateAsync(payload)
      navigate(`/admin/members/${memberId}`, { replace: true, state: { updated: true } })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to update member.')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/members">Members</Link> / <Link to={`/admin/members/${memberId}`}>{member.first_name} {member.last_name}</Link> / Edit
          </p>
          <h1>Edit Member</h1>
        </div>
      </div>
      <div className="admin-section" style={{ maxWidth: '48rem' }}>
        <MemberForm initial={member} onSubmit={handleSubmit} submitLabel="Save Changes" serverError={serverError} />
      </div>
    </div>
  )
}
