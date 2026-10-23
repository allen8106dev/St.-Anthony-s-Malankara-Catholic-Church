import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth, type AdminRole } from '../auth/AuthContext'
import { GlobalLoadingIndicator } from '../components/ui/GlobalLoadingIndicator'

type NavItem = { to: string; label: string; roles?: AdminRole[] }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'CMS',
    items: [
      { to: '/admin/content/homepage', label: 'Homepage', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/about', label: 'About', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/liturgy', label: 'Liturgy', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/events', label: 'Events', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/announcements', label: 'Announcements', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/gallery', label: 'Gallery', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
      { to: '/admin/content/service-times', label: 'Service Times', roles: ['SUPER_ADMIN', 'CONTENT_ADMIN'] },
    ],
  },
  {
    label: 'Members',
    items: [
      { to: '/admin/members', label: 'Members', roles: ['SUPER_ADMIN', 'MEMBER_ADMIN'] },
      { to: '/admin/families', label: 'Families', roles: ['SUPER_ADMIN', 'MEMBER_ADMIN'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/finance', label: 'Overview', roles: ['SUPER_ADMIN', 'TREASURER', 'MEMBER_ADMIN'] },
      { to: '/admin/finance/dues', label: 'Dues', roles: ['SUPER_ADMIN', 'MEMBER_ADMIN', 'TREASURER'] },
      { to: '/admin/finance/payments', label: 'Payments', roles: ['SUPER_ADMIN', 'TREASURER'] },
    ],
  },
]

const topItems: NavItem[] = [
  { to: '/admin', label: 'Overview' },
]

const bottomItems: NavItem[] = [
  { to: '/admin/settings', label: 'Settings', roles: ['SUPER_ADMIN'] },
]

export function AdminLayout() {
  const { currentUser, logout } = useAuth()
  const [open, setOpen] = useState(false)

  async function signOut() {
    try {
      await logout()
    } catch {
      // AuthContext clears the local admin session even if the API request fails.
    }
    window.location.replace('/')
  }

  function visible(item: NavItem) {
    return !item.roles || (currentUser && item.roles.includes(currentUser.role))
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button className="admin-menu" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">☰</button>
        <span>St. Anthony's <small>Administration</small></span>
        <button className="admin-logout" onClick={() => void signOut()}>Sign out</button>
      </header>

      <aside className={`admin-sidebar ${open ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-brand">St. Anthony's <span>Church platform</span></div>

        <nav>
          {topItems.filter(visible).map(item => (
            <NavLink key={item.to} to={item.to} end onClick={() => setOpen(false)}>{item.label}</NavLink>
          ))}

          {navGroups.map(group => {
            const visibleItems = group.items.filter(visible)
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label} className="admin-nav-group">
                <span className="admin-nav-group__label">{group.label}</span>
                {visibleItems.map(item => (
                  <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>
                ))}
              </div>
            )
          })}

          {bottomItems.filter(visible).map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>
          ))}
        </nav>

        <div className="admin-user">
          <strong>{currentUser?.name}</strong>
          <span>{currentUser?.role.replace(/_/g, ' ')}</span>
          <span className="admin-user__email">{currentUser?.email}</span>
          <button className="admin-logout admin-user__logout" type="button" onClick={() => void signOut()}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main"><Outlet /></main>
      <GlobalLoadingIndicator />
    </div>
  )
}
