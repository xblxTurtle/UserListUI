import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { fetchSession, postLogin } from './authApi.ts'
import { AuthContext, type Auth, type LoginOutcome } from './AuthContext.ts'

type AuthState = Pick<Auth, 'isLoading' | 'username'>

/** Provides `useAuth`. Checks for an existing session (`GET /api/session`) on mount. */
function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ isLoading: true, username: null })
  // Set by a successful login, so a session check that answers later can't overwrite it.
  const loggedInRef = useRef(false)

  useEffect(() => {
    fetchSession().then((username) => {
      if (loggedInRef.current) return
      setState({ isLoading: false, username })
    })
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<LoginOutcome> => {
    const result = await postLogin(username, password)
    if (!result.ok) return result
    loggedInRef.current = true
    setState({ isLoading: false, username: result.username })
    return { ok: true }
  }, [])

  const auth = useMemo<Auth>(
    () => ({ ...state, isAuthenticated: state.username !== null, login }),
    [state, login],
  )

  return <AuthContext value={auth}>{children}</AuthContext>
}

export default AuthProvider
