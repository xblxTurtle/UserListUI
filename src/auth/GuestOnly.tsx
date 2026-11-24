import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import AuthLoading from './AuthLoading.tsx'
import { useAuth } from './useAuth.ts'

/**
 * The reverse of `Protected`: renders its children only for a logged-out user (the login page).
 * A logged-in user is sent home, replacing the history entry. Shows a spinner while the session
 * check is in flight, so a logged-in user never sees the children flash before the redirect.
 */
function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <AuthLoading />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default GuestOnly
