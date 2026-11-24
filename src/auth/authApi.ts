// REST auth calls to UserListServer. They go to VITE_API_URL_PATH on the UI's own origin, which Vite
// proxies to the server (see vite.config.ts), so the session cookie lives on the UI's origin.

const API_BASE = import.meta.env.VITE_API_URL_PATH

export type LoginError = 'invalid-credentials' | 'network' | 'server'
export type LoginResult = { ok: true; username: string } | { ok: false; error: LoginError }

/** Reads `{ username }` from a response body, or null if it isn't there. */
async function readUsername(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    const username = (body as { username?: unknown } | null)?.username
    return typeof username === 'string' ? username : null
  } catch {
    return null
  }
}

/**
 * `GET /api/session`: the logged-in username, or null when there is no valid session.
 * A network or server error also counts as no session. Never rejects.
 */
export async function fetchSession(): Promise<string | null> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/session`)
  } catch {
    return null
  }
  return response.ok ? readUsername(response) : null
}

/** `POST /api/login`. Never rejects: failures come back as `{ ok: false, error }`. */
export async function postLogin(username: string, password: string): Promise<LoginResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (response.status === 401) return { ok: false, error: 'invalid-credentials' }
  if (!response.ok) return { ok: false, error: 'server' }

  const loggedInAs = await readUsername(response)
  return loggedInAs === null ? { ok: false, error: 'server' } : { ok: true, username: loggedInAs }
}
