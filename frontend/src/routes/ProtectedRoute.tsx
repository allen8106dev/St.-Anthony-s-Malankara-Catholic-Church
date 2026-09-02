import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type AdminRole } from '../auth/AuthContext'

export function ProtectedRoute({ roles }: { roles?: AdminRole[] }) {
  const { isAuthenticated, isLoading, currentUser } = useAuth(); const location = useLocation()
  if (isLoading) return <div className="auth-loading">Loading secure administration…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && currentUser && !roles.includes(currentUser.role)) return <Navigate to="/admin" replace />
  return <Outlet />
}

const routeRoles: Record<string, AdminRole[]> = {
  '/admin': ['SUPER_ADMIN', 'CONTENT_ADMIN', 'MEMBER_ADMIN', 'TREASURER'],
  '/admin/content': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/homepage': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/about': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/events': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/announcements': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/sermons': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/gallery': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/service-times': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/content/settings': ['SUPER_ADMIN', 'CONTENT_ADMIN'],
  '/admin/members': ['SUPER_ADMIN', 'MEMBER_ADMIN'],
  '/admin/families': ['SUPER_ADMIN', 'MEMBER_ADMIN'],
  '/admin/finance': ['SUPER_ADMIN', 'TREASURER', 'MEMBER_ADMIN'],
  '/admin/finance/dues': ['SUPER_ADMIN', 'MEMBER_ADMIN', 'TREASURER'],
  '/admin/finance/payments': ['SUPER_ADMIN', 'TREASURER'],
  '/admin/settings': ['SUPER_ADMIN'],
}

function resolveRouteRoles(pathname: string): AdminRole[] | undefined {
  const matches = Object.entries(routeRoles)
    .filter(([route]) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b[0].length - a[0].length)

  return matches[0]?.[1]
}

export function AdminRouteGuard() {
  const location = useLocation(); const roles = resolveRouteRoles(location.pathname)
  return <ProtectedRoute roles={roles} />
}
