import { StrictMode, type ReactNode } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import AuthProvider from './AuthProvider.tsx'
import { useAuth } from './useAuth.ts'

type Handler = (request: Request) => Promise<Response>

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
const loggedIn = (username: string) => () => json(200, { username })
const loggedOut = () => () => json(401, { error: 'Not logged in' })
const networkError = () => () => Promise.reject(new TypeError('Failed to fetch'))

/** A response the test sends by hand, to act while the request is still in flight. */
function deferred() {
  let send: (response: Response) => void = () => {}
  const handler: Handler = () => new Promise((resolve) => (send = resolve))
  return { handler, send: (status: number, body: unknown) => json(status, body).then(send) }
}

/** Stubs fetch. Requests to /api/session and /api/login go to the given handlers, and every request is recorded. */
function stubServer(handlers: { session: Handler; login?: Handler }) {
  const requests: Request[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const request = new Request(input, init)
    requests.push(request)
    const { pathname } = new URL(request.url)
    if (pathname === '/api/session') return handlers.session(request)
    if (pathname === '/api/login' && handlers.login) return handlers.login(request)
    return Promise.reject(new Error(`Unexpected request: ${request.method} ${pathname}`))
  })
  return {
    requests,
    paths: () => requests.map((request) => `${request.method} ${new URL(request.url).pathname}`),
  }
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode>
    <AuthProvider>{children}</AuthProvider>
  </StrictMode>
)

const renderAuth = () => renderHook(() => useAuth(), { wrapper })

/** Renders the provider and waits until the session check on mount has finished. */
async function renderSettled() {
  const hook = await renderAuth()
  await vi.waitFor(() => expect(hook.result.current.isLoading).toBe(false))
  return hook
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('session check on mount', () => {
  test('is loading and logged out while GET /api/session is in flight', async () => {
    const session = deferred()
    const server = stubServer({ session: session.handler })

    const { result } = await renderAuth()

    expect(result.current).toMatchObject({ isLoading: true, isAuthenticated: false, username: null })
    expect(server.paths()).toContain('GET /api/session')
    expect(server.paths().every((path) => path === 'GET /api/session')).toBe(true)
  })

  test('a valid session logs the user in', async () => {
    stubServer({ session: loggedIn('ada') })

    const { result } = await renderSettled()

    expect(result.current).toMatchObject({ isLoading: false, isAuthenticated: true, username: 'ada' })
  })

  test('401 means logged out', async () => {
    stubServer({ session: loggedOut() })

    const { result } = await renderSettled()

    expect(result.current).toMatchObject({ isLoading: false, isAuthenticated: false, username: null })
  })

  test('a network error means logged out', async () => {
    stubServer({ session: networkError() })

    const { result } = await renderSettled()

    expect(result.current).toMatchObject({ isLoading: false, isAuthenticated: false, username: null })
  })

  test('a server error means logged out', async () => {
    stubServer({ session: () => json(500, { error: 'boom' }) })

    const { result } = await renderSettled()

    expect(result.current).toMatchObject({ isLoading: false, isAuthenticated: false, username: null })
  })

  test('a 200 without a username means logged out', async () => {
    stubServer({ session: () => json(200, {}) })

    const { result } = await renderSettled()

    expect(result.current).toMatchObject({ isLoading: false, isAuthenticated: false, username: null })
  })
})

describe('login', () => {
  test('POSTs the credentials as JSON to /api/login', async () => {
    const server = stubServer({ session: loggedOut(), login: loggedIn('ada') })
    const { result } = await renderSettled()

    await result.current.login('ada', 'secret')

    const request = server.requests.find((r) => r.url.endsWith('/api/login'))
    expect(request?.method).toBe('POST')
    expect(request?.headers.get('Content-Type')).toBe('application/json')
    expect(await request?.json()).toEqual({ username: 'ada', password: 'secret' })
  })

  test('success logs the user in with the username the server returns', async () => {
    stubServer({ session: loggedOut(), login: loggedIn('ada') })
    const { result } = await renderSettled()

    expect(await result.current.login('ada', 'secret')).toEqual({ ok: true })

    await vi.waitFor(() =>
      expect(result.current).toMatchObject({
        isLoading: false,
        isAuthenticated: true,
        username: 'ada',
      }),
    )
  })

  test('401 returns invalid-credentials and stays logged out', async () => {
    stubServer({
      session: loggedOut(),
      login: () => json(401, { error: 'Invalid username or password' }),
    })
    const { result } = await renderSettled()

    expect(await result.current.login('ada', 'wrong')).toEqual({
      ok: false,
      error: 'invalid-credentials',
    })
    expect(result.current).toMatchObject({ isAuthenticated: false, username: null })
  })

  test('a network error returns network', async () => {
    stubServer({ session: loggedOut(), login: networkError() })
    const { result } = await renderSettled()

    expect(await result.current.login('ada', 'secret')).toEqual({ ok: false, error: 'network' })
    expect(result.current).toMatchObject({ isAuthenticated: false, username: null })
  })

  test('a server error returns server', async () => {
    stubServer({ session: loggedOut(), login: () => json(500, { error: 'boom' }) })
    const { result } = await renderSettled()

    expect(await result.current.login('ada', 'secret')).toEqual({ ok: false, error: 'server' })
    expect(result.current).toMatchObject({ isAuthenticated: false, username: null })
  })

  test('a 200 without a username returns server', async () => {
    stubServer({ session: loggedOut(), login: () => json(200, {}) })
    const { result } = await renderSettled()

    expect(await result.current.login('ada', 'secret')).toEqual({ ok: false, error: 'server' })
    expect(result.current).toMatchObject({ isAuthenticated: false, username: null })
  })

  test('a failed login keeps an existing session, as the server does', async () => {
    stubServer({ session: loggedIn('ada'), login: () => json(401, { error: 'Invalid' }) })
    const { result } = await renderSettled()

    await result.current.login('grace', 'wrong')

    expect(result.current).toMatchObject({ isAuthenticated: true, username: 'ada' })
  })

  test('a successful login is not undone by a session check that answers later', async () => {
    const session = deferred()
    stubServer({ session: session.handler, login: loggedIn('ada') })
    const { result } = await renderAuth()

    expect(await result.current.login('ada', 'secret')).toEqual({ ok: true })
    await vi.waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    await session.send(401, { error: 'Not logged in' })
    // Give the late response time to (wrongly) apply.
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(result.current).toMatchObject({
      isLoading: false,
      isAuthenticated: true,
      username: 'ada',
    })
  })
})

test('useAuth throws outside AuthProvider', async () => {
  const { result } = await renderHook(() => {
    try {
      useAuth()
      return null
    } catch (error) {
      return error
    }
  })

  expect(result.current).toBeInstanceOf(Error)
  expect((result.current as Error).message).toMatch(/AuthProvider/)
})
