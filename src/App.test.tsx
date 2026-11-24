// The real route table with each auth state. The guards themselves are tested in src/auth/.
import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from './App.tsx'
import type { Auth } from './auth/AuthContext.ts'
import { AuthContext } from './auth/AuthContext.ts'
import { checkingSession, fakeAuth, loggedOut } from './test/auth.ts'
import './index.css'

function renderApp(auth: Auth, route: string) {
  return render(
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </AuthContext>,
  )
}

const loginForm = () => page.getByRole('heading', { level: 1, name: 'Log in' })

describe('logged out', () => {
  test.each(['/', '/users', '/about', '/no-such-page'])(
    '%s shows the login form inside the layout',
    async (route) => {
      await renderApp(loggedOut(), route)

      await expect.element(loginForm()).toBeVisible()
      await expect.element(page.getByRole('textbox', { name: /^Username/ })).toBeVisible()
      await expect.element(page.getByRole('banner')).toBeVisible()
    },
  )

  test('/login shows the login form', async () => {
    await renderApp(loggedOut(), '/login')

    await expect.element(loginForm()).toBeVisible()
  })
})

describe('logged in', () => {
  test('/login sends the user to the home page', async () => {
    await renderApp(fakeAuth(), '/login')

    await expect.element(page.getByRole('heading', { level: 1, name: 'Welcome' })).toBeVisible()
    await expect.element(loginForm()).not.toBeInTheDocument()
  })

  test.each([
    ['/', 'Welcome'],
    ['/about', 'About'],
    ['/no-such-page', 'Page not found'],
  ])('%s shows its page', async (route, heading) => {
    await renderApp(fakeAuth(), route)

    await expect.element(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  })
})

describe('while the session check is in flight', () => {
  test.each(['/', '/login'])('%s shows the spinner inside the layout', async (route) => {
    await renderApp(checkingSession(), route)

    await expect.element(page.getByRole('banner')).toBeVisible()
    await expect
      .element(page.getByRole('main').getByRole('progressbar', { name: 'Checking your session' }))
      .toBeVisible()
    await expect.element(page.getByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })
})
