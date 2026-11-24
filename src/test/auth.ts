// Shared helper for tests that need a fixed auth state.
import type { Auth } from '../auth/AuthContext.ts'

/**
 * A complete `useAuth()` value. Provide it with `<AuthContext value={fakeAuth(...)}>` to render in any
 * auth state without stubbing fetch. Logged in as `ada` by default; pass `username: null` for logged out.
 */
export function fakeAuth({
  isLoading = false,
  username = 'ada',
}: { isLoading?: boolean; username?: string | null } = {}): Auth {
  return {
    isLoading,
    isAuthenticated: username !== null,
    username,
    login: async () => ({ ok: true }),
  }
}

export const loggedOut = () => fakeAuth({ username: null })
export const checkingSession = () => fakeAuth({ isLoading: true, username: null })
