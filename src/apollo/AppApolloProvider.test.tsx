// End to end in the browser: the real AuthProvider, AppApolloProvider and routes, with fetch stubbed.
import { StrictMode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../App.tsx'
import AuthProvider from '../auth/AuthProvider.tsx'
import AppApolloProvider from './AppApolloProvider.tsx'
import '../index.css'

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )

/** Logged in as ada; /graphql answers with `graphql`. */
function stubServer(graphql: () => Promise<Response>) {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const { pathname } = new URL(new Request(input, init).url)
    if (pathname === '/api/session') return json(200, { username: 'ada' })
    if (pathname === '/graphql') return graphql()
    return Promise.reject(new Error(`Unexpected request: ${pathname}`))
  })
}

function PathProbe() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderApp(route: string) {
  return render(
    <StrictMode>
      <AuthProvider>
        <AppApolloProvider>
          <MemoryRouter initialEntries={[route]}>
            <App />
            <PathProbe />
          </MemoryRouter>
        </AppApolloProvider>
      </AuthProvider>
    </StrictMode>,
  )
}

// Desktop width, so the header shows its nav links inline when logged in.
beforeEach(async () => {
  await page.viewport(1200, 800)
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('a 401 from /graphql logs the user out and sends them to /login', async () => {
  stubServer(() =>
    json(401, { errors: [{ message: 'Not logged in', extensions: { code: 'UNAUTHENTICATED' } }] }),
  )

  await renderApp('/users')

  await expect.element(page.getByRole('heading', { level: 1, name: 'Log in' })).toBeVisible()
  await expect.element(page.getByTestId('path')).toHaveTextContent('/login')
  // Logged out: the header hides its nav.
  await expect.element(page.getByRole('link', { name: 'Users', exact: true })).not.toBeInTheDocument()
})

test('a 500 from /graphql keeps the user logged in on the page', async () => {
  stubServer(() => json(500, { errors: [{ message: 'boom' }] }))

  await renderApp('/users')

  await expect.element(page.getByRole('button', { name: /retry/i })).toBeVisible()
  await expect.element(page.getByTestId('path')).toHaveTextContent('/users')
  await expect.element(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible()
})
