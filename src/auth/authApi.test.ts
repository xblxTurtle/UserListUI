import { afterEach, describe, expect, test, vi } from 'vitest'
import { fetchSession, postLogin } from './authApi.ts'

/** A response with a raw body, so tests can also send bodies that aren't valid JSON. */
const raw = (status: number, body: string) => () =>
  Promise.resolve(new Response(body, { status, headers: { 'Content-Type': 'application/json' } }))
const json = (status: number, body: unknown) => raw(status, JSON.stringify(body))
const networkError = () => Promise.reject(new TypeError('Failed to fetch'))

/** Stubs fetch with one response and records the request it got. */
function stubFetch(respond: () => Promise<Response>) {
  const requests: Request[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    requests.push(new Request(input, init))
    return respond()
  })
  return requests
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchSession', () => {
  test('sends GET /api/session on the app origin', async () => {
    const requests = stubFetch(json(200, { username: 'ada' }))

    await fetchSession()

    expect(requests).toHaveLength(1)
    const [request] = requests
    expect(request.method).toBe('GET')
    expect(new URL(request.url).origin).toBe(location.origin)
    expect(new URL(request.url).pathname).toBe('/api/session')
  })

  test('returns the username for a valid session', async () => {
    stubFetch(json(200, { username: 'ada' }))

    expect(await fetchSession()).toBe('ada')
  })

  test.each([
    ['401 (no session)', json(401, { error: 'Not logged in' })],
    ['500', json(500, { error: 'boom' })],
    ['a network error', networkError],
    ['200 without a username', json(200, {})],
    ['200 with a non-string username', json(200, { username: 42 })],
    ['200 with a null body', json(200, null)],
    ['200 with a body that is not JSON', raw(200, '<html>proxy error</html>')],
  ])('returns null for %s, never rejects', async (_label, respond) => {
    stubFetch(respond)

    await expect(fetchSession()).resolves.toBeNull()
  })
})

describe('postLogin', () => {
  test('POSTs the credentials as JSON to /api/login on the app origin', async () => {
    const requests = stubFetch(json(200, { username: 'ada' }))

    await postLogin('ada', 'secret')

    expect(requests).toHaveLength(1)
    const [request] = requests
    expect(request.method).toBe('POST')
    expect(new URL(request.url).origin).toBe(location.origin)
    expect(new URL(request.url).pathname).toBe('/api/login')
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(await request.json()).toEqual({ username: 'ada', password: 'secret' })
  })

  test('success returns the username from the response, not the one that was sent', async () => {
    stubFetch(json(200, { username: 'ada' }))

    expect(await postLogin('someone-else', 'secret')).toEqual({ ok: true, username: 'ada' })
  })

  test('401 returns invalid-credentials', async () => {
    stubFetch(json(401, { error: 'Invalid username or password' }))

    expect(await postLogin('ada', 'wrong')).toEqual({ ok: false, error: 'invalid-credentials' })
  })

  test('a network error returns network', async () => {
    stubFetch(networkError)

    await expect(postLogin('ada', 'secret')).resolves.toEqual({ ok: false, error: 'network' })
  })

  test.each([
    ['400', json(400, { error: 'username and password must be strings' })],
    ['500', json(500, { error: 'boom' })],
    ['502 from the proxy with a non-JSON body', raw(502, 'Bad Gateway')],
    ['200 without a username', json(200, {})],
    ['200 with a non-string username', json(200, { username: 42 })],
    ['200 with a body that is not JSON', raw(200, 'not json')],
  ])('%s returns server, never rejects', async (_label, respond) => {
    stubFetch(respond)

    await expect(postLogin('ada', 'secret')).resolves.toEqual({ ok: false, error: 'server' })
  })
})
