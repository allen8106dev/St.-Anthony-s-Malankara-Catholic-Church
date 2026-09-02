import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { AdminRouteGuard } from './ProtectedRoute'
import { HomePage } from '../pages/public/HomePage'
import { AboutPage, AnnouncementsPage, ContactPage, DonatePage, EventsPage, GalleryPage, MinistriesPage, NotFoundPage, SermonsPage } from '../pages/public/PublicPages'
import { MembersPage } from '../pages/admin/MembersPage'
import { MemberDetailPage } from '../pages/admin/MemberDetailPage'
import { AddMemberPage } from '../pages/admin/AddMemberPage'
import { EditMemberPage } from '../pages/admin/EditMemberPage'
import { FamiliesPage } from '../pages/admin/FamiliesPage'
import { FamilyDetailPage } from '../pages/admin/FamilyDetailPage'
import { AddFamilyPage } from '../pages/admin/AddFamilyPage'
import { EditFamilyPage } from '../pages/admin/EditFamilyPage'
import { ContentDashboard } from '../pages/admin/cms/ContentDashboard'
import { EventsPage as AdminEventsPage, EventFormPage } from '../pages/admin/cms/EventsPage'
import { AnnouncementsPage as AdminAnnouncementsPage, AnnouncementFormPage } from '../pages/admin/cms/AnnouncementsPage'
import { SermonsPage as AdminSermonsPage, SermonFormPage } from '../pages/admin/cms/SermonsPage'
import { GalleryPage as AdminGalleryPage, AlbumFormPage, AlbumDetailPage } from '../pages/admin/cms/GalleryPage'
import { ServiceTimesPage } from '../pages/admin/cms/ServiceTimesPage'
import { HomepagePage } from '../pages/admin/cms/HomepagePage'
import { AboutCmsPage } from '../pages/admin/cms/AboutCmsPage'
import { SettingsPage } from '../pages/admin/cms/SettingsPage'

import { CreateDuePage } from '../pages/admin/finance/CreateDuePage'
import { DueDetailPage } from '../pages/admin/finance/DueDetailPage'
import { DuesPage } from '../pages/admin/finance/DuesPage'
import { EditDuePage } from '../pages/admin/finance/EditDuePage'
import { FinanceOverviewPage } from '../pages/admin/finance/FinanceOverviewPage'
import { PaymentDetailPage } from '../pages/admin/finance/PaymentDetailPage'
import { PaymentsPage } from '../pages/admin/finance/PaymentsPage'
import { RecordPaymentPage } from '../pages/admin/finance/RecordPaymentPage'

function DonationsPlaceholder() {
  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Donations</h1><p>Online donation processing</p></div>
      </div>
      <div className="admin-empty" style={{ padding: '2rem', background: 'var(--surface-muted)', borderRadius: '8px', maxWidth: '36rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '.5rem' }}>Online donations are on hold.</p>
        <p style={{ margin: 0, color: 'var(--muted)' }}>
          Payment gateway integration is intentionally deferred to a future phase.
          Manual payments can be recorded under Finance → Payments.
        </p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ministries" element={<MinistriesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/sermons" element={<SermonsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginPage />} />

      <Route element={<AdminRouteGuard />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />

          {/* CMS Content */}
          <Route path="content" element={<ContentDashboard />} />
          <Route path="content/homepage" element={<HomepagePage />} />
          <Route path="content/about" element={<AboutCmsPage />} />
          <Route path="content/events" element={<AdminEventsPage />} />
          <Route path="content/events/new" element={<EventFormPage />} />
          <Route path="content/events/:eventId/edit" element={<EventFormPage />} />
          <Route path="content/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="content/announcements/new" element={<AnnouncementFormPage />} />
          <Route path="content/announcements/:announcementId/edit" element={<AnnouncementFormPage />} />
          <Route path="content/sermons" element={<AdminSermonsPage />} />
          <Route path="content/sermons/new" element={<SermonFormPage />} />
          <Route path="content/sermons/:sermonId/edit" element={<SermonFormPage />} />
          <Route path="content/gallery" element={<AdminGalleryPage />} />
          <Route path="content/gallery/new" element={<AlbumFormPage />} />
          <Route path="content/gallery/:albumId" element={<AlbumDetailPage />} />
          <Route path="content/gallery/:albumId/edit" element={<AlbumFormPage />} />
          <Route path="content/service-times" element={<ServiceTimesPage />} />
          <Route path="content/settings" element={<SettingsPage />} />

          {/* Members */}
          <Route path="members" element={<MembersPage />} />
          <Route path="members/new" element={<AddMemberPage />} />
          <Route path="members/:memberId" element={<MemberDetailPage />} />
          <Route path="members/:memberId/edit" element={<EditMemberPage />} />

          {/* Families */}
          <Route path="families" element={<FamiliesPage />} />
          <Route path="families/new" element={<AddFamilyPage />} />
          <Route path="families/:familyId" element={<FamilyDetailPage />} />
          <Route path="families/:familyId/edit" element={<EditFamilyPage />} />

          {/* Finance Management */}
          <Route path="finance" element={<FinanceOverviewPage />} />
          <Route path="finance/dues" element={<DuesPage />} />
          <Route path="finance/dues/new" element={<CreateDuePage />} />
          <Route path="finance/dues/:dueId" element={<DueDetailPage />} />
          <Route path="finance/dues/:dueId/edit" element={<EditDuePage />} />
          <Route path="finance/payments" element={<PaymentsPage />} />
          <Route path="finance/payments/record" element={<RecordPaymentPage />} />
          <Route path="finance/payments/:paymentId" element={<PaymentDetailPage />} />

          {/* Legacy finance aliases / placeholders */}
          <Route path="dues" element={<DuesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="donations" element={<DonationsPlaceholder />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
