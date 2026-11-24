import { MemoryRouter, Route, Routes, useNavigationType } from 'react-router'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { checkingSession, fakeAuth, loggedOut } from '../test/auth.ts'
import type { Auth } from './AuthContext.ts'
import { AuthContext } from './AuthContext.ts'
import GuestOnly from './GuestOnly.tsx'

/** Stands in for the home page and shows how it was reached. */
function HomeProbe() {
  return <p>home page, navigation {useNavigationType()}</p>
}

function routes() {
  return (
    <Routes>
      <Route path="/" element={<HomeProbe />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <p>login form</p>
          </GuestOnly>
        }
      />
    </Routes>
  )
}

function tree(auth: Auth) {
  return (
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={['/login']}>{routes()}</MemoryRouter>
    </AuthContext>
  )
}

const spinner = () => page.getByRole('progressbar', { name: 'Checking your session' })

test('shows a spinner, not the form, while the session check is in flight', async () => {
  await render(tree(checkingSession()))

  await expect.element(spinner()).toBeVisible()
  await expect.element(page.getByText('login form')).not.toBeInTheDocument()
  await expect.element(page.getByText(/home page/)).not.toBeInTheDocument()
})

test('renders the children for a logged-out user', async () => {
  await render(tree(loggedOut()))

  await expect.element(page.getByText('login form')).toBeVisible()
  await expect.element(spinner()).not.toBeInTheDocument()
})

test('sends a logged-in user home, replacing history', async () => {
  await render(tree(fakeAuth()))

  await expect.element(page.getByText('home page, navigation REPLACE')).toBeVisible()
  await expect.element(page.getByText('login form')).not.toBeInTheDocument()
})

test('shows the form once the session check finds no session', async () => {
  const { rerender } = await render(tree(checkingSession()))
  await expect.element(spinner()).toBeVisible()

  await rerender(tree(loggedOut()))

  await expect.element(page.getByText('login form')).toBeVisible()
  await expect.element(spinner()).not.toBeInTheDocument()
})

test('sends the user home once they log in on the page', async () => {
  const { rerender } = await render(tree(loggedOut()))
  await expect.element(page.getByText('login form')).toBeVisible()

  await rerender(tree(fakeAuth()))

  await expect.element(page.getByText(/^home page/)).toBeVisible()
})
