import type { ReactNode } from 'react'
import { Navigate, useLocation, type To } from 'react-router'
import AuthLoading from './AuthLoading.tsx'
import { useAuth } from './useAuth.ts'

/**
 * Where to send a logged-in user: the page `Protected` sent them away from (`state.from`, path,
 * query and hash), else home. `from` only ever comes from our own navigation state, never from the
 * URL, and anything that isn't an app path falls back to home.
 */
function returnTo(state: unknown): To {
  const from = (state as { from?: unknown } | null)?.from
  if (typeof from !== 'object' || from === null) return '/'
  const { pathname, search, hash } = from as { pathname?: unknown; search?: unknown; hash?: unknown }
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) return '/'
  return {
    pathname,
    search: typeof search === 'string' ? search : '',
    hash: typeof hash === 'string' ? hash : '',
  }
}

/**
 * The reverse of `Protected`: renders its children only for a logged-out user (the login page).
 * A logged-in user is sent back to the page they first asked for, or home, replacing the history
 * entry. That includes the moment a login succeeds on the page, so the page itself never navigates.
 * Shows a spinner while the session check is in flight, so a logged-in user never sees the children
 * flash before the redirect.
 */
function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoading />
  if (isAuthenticated) return <Navigate to={returnTo(location.state)} replace />
  return children
}

export default GuestOnly
