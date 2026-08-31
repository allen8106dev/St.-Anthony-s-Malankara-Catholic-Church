import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { HomePage } from '../pages/public/HomePage'
import { AboutPage, AnnouncementsPage, ContactPage, DonatePage, EventsPage, GalleryPage, MinistriesPage, NotFoundPage, SermonsPage } from '../pages/public/PublicPages'

const adminRoutes = ['', 'members', 'families', 'dues', 'donations', 'events', 'announcements', 'gallery', 'sermons', 'content', 'settings']

export function AppRoutes() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<HomePage />} /><Route path="/about" element={<AboutPage />} /><Route path="/ministries" element={<MinistriesPage />} /><Route path="/events" element={<EventsPage />} /><Route path="/announcements" element={<AnnouncementsPage />} /><Route path="/sermons" element={<SermonsPage />} /><Route path="/gallery" element={<GalleryPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/donate" element={<DonatePage />} /><Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="/admin/login" element={<PlaceholderPage area="Admin login" />} />
    <Route path="/admin" element={<AdminLayout />}>{adminRoutes.map((path) => <Route key={path} index={path === ''} path={path || undefined} element={<PlaceholderPage area="Admin" />} />)}</Route>
  </Routes>
}
