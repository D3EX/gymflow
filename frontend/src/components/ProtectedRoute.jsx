import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute({ allowedRoles = [], skipStatusGate = false }) {
  const { isAuthenticated, user } = useAuthStore()

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user?.role)
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'admin') {
        return <Navigate to="/dashboard" replace />
      } else if (user?.role === 'client') {
        return <Navigate to="/member" replace />
      }
      return <Navigate to="/login" replace />
    }
  }

  // Pending clients can't access member routes until admin activates them.
  // skipStatusGate lets the pending-approval route itself bypass this check,
  // otherwise a pending user landing there would be redirected right back to
  // itself in an infinite loop.
  if (!skipStatusGate && user?.role === 'client' && user?.status === 'pending') {
    return <Navigate to="/pending-approval" replace />
  }

  return <Outlet />
}