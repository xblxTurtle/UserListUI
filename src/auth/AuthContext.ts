import { createContext } from 'react'
import type { LoginError } from './authApi.ts'

/** What `login` resolves to. It never rejects. */
export type LoginOutcome = { ok: true } | { ok: false; error: LoginError }

export type Auth = {
  /** True only while the session check on mount is in flight. `login` does not set it. */
  isLoading: boolean
  isAuthenticated: boolean
  /** The logged-in username, or null when logged out. */
  username: string | null
  /**
   * Logs in through `POST /api/login`. On success the state becomes authenticated; on failure it is
   * unchanged. (On a 401 the server also deletes any existing session cookie, so the next /graphql
   * request gets a 401 and logs out. In the app, login is only reachable while logged out anyway.)
   */
  login: (username: string, password: string) => Promise<LoginOutcome>
  /**
   * Logs out on the client only (the server has no logout route): the state becomes logged out and
   * `Protected` sends the user to /login. Called on any 401. Stable across renders.
   */
  logout: () => void
}

/** Null outside `AuthProvider`. Read it with `useAuth`, which throws there instead. */
export const AuthContext = createContext<Auth | null>(null)
