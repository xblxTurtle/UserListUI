import type { Location } from 'react-router'
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { checkingSession, fakeAuth, loggedOut } from '../test/auth.ts'
import type { Auth } from './AuthContext.ts'
import { AuthContext } from './AuthContext.ts'
import Protected from './Protected.tsx'

/** Stands in for the login page and shows how it was reached. */
function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from
  return (
    <p>
      login page, navigation {useNavigationType()}, from {from ? `${from.pathname}${from.search}` : 'none'}
    </p>
  )
}

function routes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginProbe />} />
      <Route
        path="/users"
        element={
          <Protected>
            <p>private users page</p>
          </Protected>
        }
      />
    </Routes>
  )
}

function renderAt(auth: Auth, route = '/users?page=2') {
  return render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={[route]}>{routes()}</MemoryRouter>
    </AuthContext>,
  )
}

const spinner = () => page.getByRole('progressbar', { name: 'Checking your session' })

test('shows a spinner, not the page, while the session check is in flight', async () => {
  await renderAt(checkingSession())

  await expect.element(spinner()).toBeVisible()
  await expect.element(page.getByText('private users page')).not.toBeInTheDocument()
  await expect.element(page.getByText(/login page/)).not.toBeInTheDocument()
})

test('renders the children for a logged-in user', async () => {
  await renderAt(fakeAuth())

  await expect.element(page.getByText('private users page')).toBeVisible()
  await expect.element(spinner()).not.toBeInTheDocument()
})

test('sends a logged-out user to /login, replacing history and remembering the page', async () => {
  await renderAt(loggedOut())

  await expect
    .element(page.getByText('login page, navigation REPLACE, from /users?page=2'))
    .toBeVisible()
  await expect.element(page.getByText('private users page')).not.toBeInTheDocument()
})

test('shows the children once the session check finds a session', async () => {
  const { rerender } = await renderAt(checkingSession())
  await expect.element(spinner()).toBeVisible()

  await rerender(
    <AuthContext value={fakeAuth()}>
      <MemoryRouter initialEntries={['/users?page=2']}>{routes()}</MemoryRouter>
    </AuthContext>,
  )

  await expect.element(page.getByText('private users page')).toBeVisible()
  await expect.element(spinner()).not.toBeInTheDocument()
})

test('redirects once the session check finds no session', async () => {
  const { rerender } = await renderAt(checkingSession())
  await expect.element(spinner()).toBeVisible()

  await rerender(
    <AuthContext value={loggedOut()}>
      <MemoryRouter initialEntries={['/users?page=2']}>{routes()}</MemoryRouter>
    </AuthContext>,
  )

  await expect.element(page.getByText(/^login page/)).toBeVisible()
})
