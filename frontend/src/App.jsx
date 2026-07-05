// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Auth Pages
import Register from './pages/auth/Register'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import PendingApproval from './pages/PendingApproval'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import Members from './pages/admin/Members'
import MemberForm from './pages/admin/MemberForm'
import MemberProfile from './pages/admin/MemberProfile'
import Staff from './pages/admin/Staff'
import Equipment from './pages/admin/Equipment'
import Marketing from './pages/admin/Marketing'
import Plans from './pages/admin/Plans'
import PlanForm from './pages/admin/PlanForm'
import Subscriptions from './pages/admin/Subscriptions'
import Payments from './pages/admin/Payments'
import Attendance from './pages/admin/Attendance'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'
import Classes from './pages/admin/Classes'

// Super Admin Page
import SuperAdmin from './pages/super-admin/SuperAdmin'
import Gyms from './pages/super-admin/Gyms'
import PlansAndTiers from './pages/super-admin/PlansAndTiers'
import SuperAdminSettings from './pages/super-admin/Settings'

// Member Pages
import MemberDashboard from './pages/member/Dashboard'
import MemberProfilePage from './pages/member/Profile'
import MemberCheckIn from './pages/member/CheckIn'
import MemberMembership from './pages/member/Membership'
import MemberPayments from './pages/member/Payments'
import MemberProgram from './pages/member/Program'
import MemberSchedule from './pages/member/Schedule'
import MemberNutrition from './pages/member/Nutrition'
import MemberOffers from './pages/member/Offers'
import MemberPersonalSessions from './pages/member/PersonalSessions'
import MemberCoaches from './pages/member/Coaches'

// Coach Pages
import CoachDashboard from './pages/coach/Dashboard'
import CoachClients from './pages/coach/Clients'
import CoachClientDetail from './pages/coach/ClientDetail'
import CoachAvailability from './pages/coach/availability/Availability'
import CoachProfile from './pages/coach/Profile'
import CoachSettings from './pages/coach/Settings'
import CoachPrograms from './pages/coach/Programs'
import CoachClasses from './pages/coach/Classes'
import CoachMessages from './pages/coach/Messages'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES - No authentication required */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PENDING APPROVAL */}
          <Route path="/pending-approval" element={<ProtectedRoute allowedRoles={['client']} skipStatusGate />}>
            <Route index element={<PendingApproval />} />
          </Route>

          {/* ADMIN ROUTES - Protected */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="members/:id" element={<MemberProfile />} />
              <Route path="members/:id/edit" element={<MemberForm />} />
              <Route path="staff" element={<Staff />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="plans" element={<Plans />} />
              <Route path="plans/new" element={<PlanForm />} />
              <Route path="plans/:id/edit" element={<PlanForm />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="payments" element={<Payments />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="classes" element={<Classes />} />
            </Route>
          </Route>

          {/* SUPER ADMIN ROUTE - Protected */}
          <Route path="/dashboard/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']} />}>
             <Route element={<Layout />}>
              <Route index element={<SuperAdmin />} />
              <Route path="gyms" element={<Gyms />} />
              <Route path="tiers" element={<PlansAndTiers />} />
              <Route path="settings" element={<SuperAdminSettings />} />
             </Route>
          </Route>

          {/* COACH ROUTES - Protected */}
          <Route path="/coach" element={<ProtectedRoute allowedRoles={['coach', 'admin']} />}>
            <Route element={<Layout />}>
              <Route index element={<CoachDashboard />} />
              <Route path="clients" element={<CoachClients />} />
              <Route path="clients/:id" element={<CoachClientDetail />} />
              <Route path="classes" element={<CoachClasses />} />
              <Route path="availability" element={<CoachAvailability />} />
              <Route path="profile" element={<CoachProfile />} />
              <Route path="settings" element={<CoachSettings />} />
              <Route path="programs" element={<CoachPrograms />} />
              <Route path="messages" element={<CoachMessages />} />
            </Route>
          </Route>

          {/* MEMBER ROUTES - Protected */}
          <Route path="/member" element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route element={<Layout />}>
              <Route index element={<MemberDashboard />} />
              <Route path="profile" element={<MemberProfilePage />} />
              <Route path="checkin" element={<MemberCheckIn />} />
              <Route path="membership" element={<MemberMembership />} />
              <Route path="payments" element={<MemberPayments />} />
              <Route path="program" element={<MemberProgram />} />
              <Route path="schedule" element={<MemberSchedule />} />
              <Route path="nutrition" element={<MemberNutrition />} />
              <Route path="offers" element={<MemberOffers />} />
              <Route path="personal-sessions" element={<MemberPersonalSessions />} />
              <Route path="coaches" element={<MemberCoaches />} />
            </Route>
          </Route>

          {/* Catch all - Redirect to login or home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App