import { Link } from 'react-router-dom'
import { useCmsDashboard } from '../../../hooks/useCms'

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="cms-stat-card">
      <span className="cms-stat-value">{value}</span>
      <span className="cms-stat-label">{label}</span>
      {sub && <span className="cms-stat-sub">{sub}</span>}
    </div>
  )
}

export function ContentDashboard() {
  const { data, isLoading } = useCmsDashboard()

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Content</h1>
          <p>Manage what appears on the public website</p>
        </div>
      </div>

      <div className="cms-stat-grid">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cms-stat-card"><div className="admin-skeleton" style={{ height: '4rem' }} /></div>
          ))
        ) : data ? (
          <>
            <StatCard label="Published Events" value={data.published_events} />
            <StatCard label="Draft Events" value={data.draft_events} />
            <StatCard label="Active Announcements" value={data.active_announcements} />
            <StatCard label="Sermons" value={data.total_sermons} />
            <StatCard label="Gallery Albums" value={data.gallery_albums} />
            <StatCard label="Active Service Times" value={data.service_times} />
          </>
        ) : null}
      </div>

      <div className="cms-quick-actions">
        <h2>Quick actions</h2>
        <div className="cms-action-grid">
          <Link to="/admin/content/events/new" className="button button--primary">+ New Event</Link>
          <Link to="/admin/content/announcements/new" className="button button--primary">+ New Announcement</Link>
          <Link to="/admin/content/sermons/new" className="button button--primary">+ Add Sermon</Link>
          <Link to="/admin/content/gallery/new" className="button button--primary">+ New Album</Link>
          <Link to="/admin/content/homepage" className="button button--outline">Edit Homepage</Link>
          <Link to="/admin/content/about" className="button button--outline">Edit About</Link>
          <Link to="/admin/content/service-times" className="button button--outline">Service Times</Link>
          <Link to="/admin/settings" className="button button--outline">Settings</Link>
        </div>
      </div>
    </div>
  )
}
