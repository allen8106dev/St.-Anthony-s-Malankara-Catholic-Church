import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { PlaceholderPage } from '../pages/PlaceholderPage'

const publicRoutes = ['/', '/about', '/ministries', '/events', '/announcements', '/sermons', '/gallery', '/contact', '/donate']
const adminRoutes = ['', 'members', 'families', 'dues', 'donations', 'events', 'announcements', 'gallery', 'sermons', 'content', 'settings']

export function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>{publicRoutes.map((path) => <Route key={path} path={path} element={<PlaceholderPage area="Public" />} />)}</Route>
    <Route path="/admin/login" element={<PlaceholderPage area="Admin login" />} />
    <Route path="/admin" element={<AdminLayout />}>{adminRoutes.map((path) => <Route key={path} index={path === ''} path={path || undefined} element={<PlaceholderPage area="Admin" />} />)}</Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
