import { Link, useParams } from 'react-router-dom'
import { useFamily } from '../../hooks/useMembers'
import { StatusBadge } from '../../components/admin/AdminShared'

export function FamilyDetailPage() {
  const { familyId } = useParams<{ familyId: string }>()
  const { data: family, isLoading, isError } = useFamily(familyId)

  if (isLoading) return (
    <div>
      <div className="admin-page-header"><div><div className="admin-skeleton" style={{ width: '14rem', height: '2rem' }} /></div></div>
      <div className="admin-detail-grid">
        {[1, 2].map((i) => <div key={i} className="admin-section"><div className="admin-skeleton" style={{ height: '8rem' }} /></div>)}
      </div>
    </div>
  )

  if (isError || !family) return (
    <div>
      <p role="alert" style={{ color: '#a0332b' }}>Family not found or failed to load.</p>
      <Link to="/admin/families" className="button button--outline" style={{ marginTop: '1rem' }}>Back to Families</Link>
    </div>
  )

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <p className="eyebrow" style={{ marginBottom: '.5rem' }}>
            <Link to="/admin/families">Families</Link> / Detail
          </p>
          <h1>{family.family_name}</h1>
        </div>
        <Link to={`/admin/families/${family.id}/edit`} className="button button--primary">Edit Family</Link>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-section">
          <h2>Family Information</h2>
          <dl>
            <div className="admin-field"><dt>Family name</dt><dd>{family.family_name}</dd></div>
            <div className="admin-field"><dt>Address</dt><dd>{family.address || <span style={{ color: 'var(--muted)' }}>—</span>}</dd></div>
            {family.notes && <div className="admin-field"><dt>Notes</dt><dd>{family.notes}</dd></div>}
          </dl>
        </div>

        <div className="admin-section">
          <h2>Family Members ({family.members.length})</h2>
          {family.members.length === 0 ? (
            <div className="admin-empty">
              <p style={{ fontWeight: 600 }}>No members assigned.</p>
              <p><Link to="/admin/members/new" style={{ color: 'var(--primary)' }}>Add a member</Link> and assign them to this family.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '.5rem' }}>
              {family.members.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</div>
                    {m.phone && <div style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{m.phone}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <StatusBadge status={m.membership_status} />
                    <Link to={`/admin/members/${m.id}`} className="button button--ghost" style={{ fontSize: '.82rem' }}>View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '.78rem', color: 'var(--muted)' }}>
        Added {new Date(family.created_at).toLocaleDateString()} · Updated {new Date(family.updated_at).toLocaleDateString()}
      </div>
    </div>
  )
}
