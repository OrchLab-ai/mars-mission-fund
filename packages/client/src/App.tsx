import React, { Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { ProposalsPage } from './pages/ProposalsPage'

const ProposalDetailPage = React.lazy(() =>
  import('./pages/ProposalDetailPage').then((m) => ({
    default: m.ProposalDetailPage,
  }))
)
const ContributePlaceholderPage = React.lazy(() =>
  import('./pages/ContributePlaceholderPage').then((m) => ({
    default: m.ContributePlaceholderPage,
  }))
)
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const ProfilePage = React.lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)
const AdminUsersPage = React.lazy(() =>
  import('./pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
)
const ReviewQueuePage = React.lazy(() =>
  import('./pages/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage }))
)
const ReviewDetailPage = React.lazy(() =>
  import('./pages/ReviewDetailPage').then((m) => ({ default: m.ReviewDetailPage }))
)
const DashboardPage = React.lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const ProposalFormPage = React.lazy(() =>
  import('./pages/ProposalFormPage').then((m) => ({ default: m.ProposalFormPage }))
)
const ProposalEditPage = React.lazy(() =>
  import('./pages/ProposalEditPage').then((m) => ({ default: m.ProposalEditPage }))
)
const NotificationsPage = React.lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposals/:id" element={<ProposalDetailPage />} />
            <Route path="/contribute/:id" element={<ContributePlaceholderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
            <Route element={<ProtectedRoute requireReviewer />}>
              <Route path="/review" element={<ReviewQueuePage />} />
              <Route path="/review/:id" element={<ReviewDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute requireCreator />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/proposals/new" element={<ProposalFormPage />} />
              <Route path="/proposals/:id/edit" element={<ProposalEditPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
