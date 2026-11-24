import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { fetchSession, postLogin } from './authApi.ts'
import { AuthContext, type Auth, type LoginOutcome } from './AuthContext.ts'

type AuthState = Pick<Auth, 'isLoading' | 'username'>

/** Provides `useAuth`. Checks for an existing session (`GET /api/session`) on mount. */
function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ isLoading: true, username: null })
  // Set once login or logout has decided the state, so a session check that answers later can't overwrite it.
  const decidedRef = useRef(false)

  useEffect(() => {
    fetchSession().then((username) => {
      if (decidedRef.current) return
      setState({ isLoading: false, username })
    })
  }, [])

  const logout = useCallback(() => {
    decidedRef.current = true
    setState({ isLoading: false, username: null })
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<LoginOutcome> => {
      const result = await postLogin(username, password)
      if (!result.ok) return result
      decidedRef.current = true
      setState({ isLoading: false, username: result.username })
      return { ok: true }
    },
    [],
  )

  const auth = useMemo<Auth>(
    () => ({ ...state, isAuthenticated: state.username !== null, login, logout }),
    [state, login, logout],
  )

  return <AuthContext value={auth}>{children}</AuthContext>
}

export default AuthProvider
