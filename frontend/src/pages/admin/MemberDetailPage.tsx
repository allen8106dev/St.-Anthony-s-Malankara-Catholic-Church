import { Link, useParams } from 'react-router-dom'
import { useMember } from '../../hooks/useMembers'
import { StatusBadge } from '../../components/admin/AdminShared'

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="admin-field">
      <dt>{label}</dt>
      <dd>{value || <span style={{ color: 'var(--muted)' }}>—</span>}</dd>
    </div>
  )
}

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { data: member, isLoading, isError } = useMember(memberId)

  if (isLoading) return (
    <div>
      <div className="admin-page-header"><div><div className="admin-skeleton" style={{ width: '14rem', height: '2rem' }} /></div></div>
      <div className="admin-detail-grid">
        {[1, 2, 3].map((i) => <div key={i} className="admin-section"><div className="admin-skeleton" style={{ height: '10rem' }} /></div>)}
      </div>
    </div>
  )

  if (isError || !member) return (
    <div>
      <p role="alert" style={{ color: '#a0332b' }}>Member not found or failed to load.</p>
      <Link to="/admin/members" className="button button--outline" style={{ marginTop: '1rem' }}>Back to Members</Link>
    </div>
  )

  const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ')

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/members">Members</Link> / Profile
          </p>
          <h1>{fullName}</h1>
          <p style={{ marginTop: '.5rem' }}><StatusBadge status={member.membership_status} /></p>
        </div>
        <Link to={`/admin/members/${member.id}/edit`} className="button button--primary">Edit Member</Link>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-section">
          <h2>Personal</h2>
          <dl>
            <Field label="Full name" value={fullName} />
            <Field label="Date of birth" value={member.date_of_birth} />
          </dl>
        </div>

        <div className="admin-section">
          <h2>Contact</h2>
          <dl>
            <Field label="Phone" value={member.phone} />
            <Field label="Email" value={member.email} />
            <Field label="Address" value={member.address} />
          </dl>
        </div>

        <div className="admin-section">
          <h2>Church Membership</h2>
          <dl>
            <Field label="Status" value={member.membership_status} />
            <Field label="Date joined" value={member.date_joined} />
          </dl>
        </div>

        <div className="admin-section">
          <h2>Family</h2>
          {member.family_id ? (
            <dl>
              <div className="admin-field">
                <dt>Family</dt>
                <dd><Link to={`/admin/families/${member.family_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{member.family_name}</Link></dd>
              </div>
            </dl>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Not assigned to a family.</p>
          )}
        </div>

        {member.notes && (
          <div className="admin-section" style={{ gridColumn: '1 / -1' }}>
            <h2>Notes</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{member.notes}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '.78rem', color: 'var(--muted)' }}>
        Added {new Date(member.created_at).toLocaleDateString()} · Updated {new Date(member.updated_at).toLocaleDateString()}
      </div>
    </div>
  )
}
