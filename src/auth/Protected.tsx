import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import AuthLoading from './AuthLoading.tsx'
import { useAuth } from './useAuth.ts'

/**
 * Renders its children only for a logged-in user. Anyone else is sent to /login, replacing the
 * history entry, with `state.from` set to the page they asked for. Shows a spinner while the session
 * check is in flight.
 */
function Protected({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoading />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export default Protected
