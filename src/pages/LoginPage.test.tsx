import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../App.tsx'
import type { Auth, LoginOutcome } from '../auth/AuthContext.ts'
import { AuthContext } from '../auth/AuthContext.ts'
import AuthProvider from '../auth/AuthProvider.tsx'
import { loggedOut } from '../test/auth.ts'
import LoginPage from './LoginPage.tsx'
import '../index.css'

type Login = Auth['login']

function renderLoginPage(login: Login) {
  return render(
    <AuthContext value={{ ...loggedOut(), login }}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext>,
  )
}

/** A login() that the test settles by hand, to look at the page while the request is in flight. */
function pendingLogin() {
  let settle: (outcome: LoginOutcome) => void = () => {}
  const login = vi.fn<Login>(() => new Promise((resolve) => (settle = resolve)))
  return { login, settle: (outcome: LoginOutcome) => settle(outcome) }
}

const usernameField = () => page.getByRole('textbox', { name: /^Username/ })
const passwordField = () => page.getByLabelText(/^Password/)
const submitButton = () => page.getByRole('button', { name: /^Log(ging)? in/ })
const alert = () => page.getByRole('alert')

async function fillIn(username: string, password: string) {
  if (username) await usernameField().fill(username)
  if (password) await passwordField().fill(password)
}

beforeEach(async () => {
  await page.viewport(1200, 800)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('submitting', () => {
  test('pressing the button calls login with the typed values', async () => {
    const login = vi.fn<Login>(async () => ({ ok: true }))
    await renderLoginPage(login)

    await fillIn('ada', 'secret')
    await submitButton().click()

    expect(login).toHaveBeenCalledExactlyOnceWith('ada', 'secret')
  })

  test('pressing Enter in the password field submits too', async () => {
    const login = vi.fn<Login>(async () => ({ ok: true }))
    await renderLoginPage(login)

    await fillIn('ada', 'secret')
    await userEvent.type(passwordField(), '{Enter}')

    expect(login).toHaveBeenCalledExactlyOnceWith('ada', 'secret')
  })

  test('while the request is in flight the button is disabled and says so', async () => {
    const { login } = pendingLogin()
    await renderLoginPage(login)

    await fillIn('ada', 'secret')
    await submitButton().click()

    await expect.element(submitButton()).toBeDisabled()
    await expect.element(submitButton()).toHaveTextContent('Logging in…')
  })

  test('a second click or Enter while in flight sends no second request', async () => {
    const { login } = pendingLogin()
    await renderLoginPage(login)

    await fillIn('ada', 'secret')
    await submitButton().click()
    await expect.element(submitButton()).toBeDisabled()
    await submitButton().click({ force: true })
    await userEvent.type(passwordField(), '{Enter}')

    expect(login).toHaveBeenCalledOnce()
  })

  test('the button works again after a failure', async () => {
    const { login, settle } = pendingLogin()
    await renderLoginPage(login)

    await fillIn('ada', 'secret')
    await submitButton().click()
    settle({ ok: false, error: 'server' })

    await expect.element(submitButton()).toBeEnabled()
    await expect.element(submitButton()).toHaveTextContent('Log in')
  })
})

describe('errors', () => {
  test.each([
    ['invalid-credentials', 'Incorrect username or password.'],
    ['server', "The server isn't responding. Try again in a moment."],
    ['network', "Can't reach the server. Check your connection and try again."],
  ] as const)('%s shows "%s"', async (error, message) => {
    await renderLoginPage(async () => ({ ok: false, error }))

    await fillIn('ada', 'secret')
    await submitButton().click()

    await expect.element(alert()).toHaveTextContent(message)
  })

  test('wrong credentials clear the password, keep the username and focus the password', async () => {
    await renderLoginPage(async () => ({ ok: false, error: 'invalid-credentials' }))

    await fillIn('ada', 'wrong')
    await submitButton().click()

    await expect.element(alert()).toBeVisible()
    await expect.element(usernameField()).toHaveValue('ada')
    await expect.element(passwordField()).toHaveValue('')
    await expect.element(passwordField()).toHaveFocus()
    // The cleared password is not an "empty field" mistake: the alert already says what went wrong.
    await expect.element(page.getByText('Enter your password')).not.toBeInTheDocument()
  })

  test('a server error keeps both values, so the user can just try again', async () => {
    await renderLoginPage(async () => ({ ok: false, error: 'server' }))

    await fillIn('ada', 'secret')
    await submitButton().click()

    await expect.element(alert()).toBeVisible()
    await expect.element(usernameField()).toHaveValue('ada')
    await expect.element(passwordField()).toHaveValue('secret')
  })

  test('the error goes away when the user submits again', async () => {
    const { login, settle } = pendingLogin()
    await renderLoginPage(login)
    await fillIn('ada', 'secret')
    await submitButton().click()
    settle({ ok: false, error: 'server' })
    await expect.element(alert()).toBeVisible()

    await submitButton().click()

    await expect.element(alert()).not.toBeInTheDocument()
  })
})

describe('empty fields', () => {
  test('are reported on the fields without sending a request, focusing the first one', async () => {
    const login = vi.fn<Login>()
    await renderLoginPage(login)

    await submitButton().click()

    expect(login).not.toHaveBeenCalled()
    await expect.element(page.getByText('Enter your username')).toBeVisible()
    await expect.element(page.getByText('Enter your password')).toBeVisible()
    await expect.element(usernameField()).toHaveAttribute('aria-invalid', 'true')
    await expect.element(usernameField()).toHaveFocus()
  })

  test('only the empty one is reported', async () => {
    const login = vi.fn<Login>()
    await renderLoginPage(login)

    await fillIn('ada', '')
    await submitButton().click()

    expect(login).not.toHaveBeenCalled()
    await expect.element(page.getByText('Enter your password')).toBeVisible()
    await expect.element(page.getByText('Enter your username')).not.toBeInTheDocument()
    await expect.element(passwordField()).toHaveFocus()
  })

  test('a username of only spaces counts as empty', async () => {
    const login = vi.fn<Login>()
    await renderLoginPage(login)

    await fillIn('   ', 'secret')
    await submitButton().click()

    expect(login).not.toHaveBeenCalled()
    await expect.element(page.getByText('Enter your username')).toBeVisible()
  })

  test('typing in a field clears its message', async () => {
    await renderLoginPage(vi.fn<Login>())
    await submitButton().click()
    await expect.element(page.getByText('Enter your username')).toBeVisible()

    await usernameField().fill('a')

    await expect.element(page.getByText('Enter your username')).not.toBeInTheDocument()
    await expect.element(page.getByText('Enter your password')).toBeVisible()
  })
})

describe('in the app', () => {
  function PathProbe() {
    const { pathname, search } = useLocation()
    return <p data-testid="path">{pathname + search}</p>
  }

  test('logging in returns the user to the page they first asked for', async () => {
    let loggedIn = false
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const request = new Request(input, init)
      const { pathname } = new URL(request.url)
      const json = (status: number, body: unknown) =>
        Promise.resolve(Response.json(body, { status }))
      if (pathname === '/api/session') return json(401, { error: 'Not logged in' })
      if (pathname === '/api/login') {
        loggedIn = true
        return json(200, { username: 'ada' })
      }
      return Promise.reject(new Error(`Unexpected request: ${pathname}`))
    })
    await render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/about?tab=team']}>
          <App />
          <PathProbe />
        </MemoryRouter>
      </AuthProvider>,
    )
    await expect.element(page.getByTestId('path')).toHaveTextContent('/login')

    await fillIn('ada', 'secret')
    await submitButton().click()

    await expect.element(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible()
    await expect.element(page.getByTestId('path')).toHaveTextContent('/about?tab=team')
    expect(loggedIn).toBe(true)
  })
})
