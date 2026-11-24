import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router'
import { describe, expect, test } from 'vitest'
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

/** Stands in for a private page and shows its full location. */
function UsersProbe() {
  const { pathname, search, hash } = useLocation()
  return (
    <p>
      users page at {pathname + search + hash}, navigation {useNavigationType()}
    </p>
  )
}

function routes() {
  return (
    <Routes>
      <Route path="/" element={<HomeProbe />} />
      <Route path="/users" element={<UsersProbe />} />
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

/** `state` is the router state /login was opened with, e.g. `{ from }` set by Protected. */
function tree(auth: Auth, state?: unknown) {
  return (
    <AuthContext value={auth}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>{routes()}</MemoryRouter>
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

describe('where a logged-in user is sent', () => {
  test('back to the page Protected sent them from, query and hash included', async () => {
    const from = { pathname: '/users', search: '?page=2', hash: '#top' }

    await render(tree(fakeAuth(), { from }))

    await expect
      .element(page.getByText('users page at /users?page=2#top, navigation REPLACE'))
      .toBeVisible()
  })

  test('back there once they log in on the page', async () => {
    const from = { pathname: '/users', search: '?page=2', hash: '' }
    const { rerender } = await render(tree(loggedOut(), { from }))
    await expect.element(page.getByText('login form')).toBeVisible()

    await rerender(tree(fakeAuth(), { from }))

    await expect.element(page.getByText(/^users page at \/users\?page=2/)).toBeVisible()
  })

  test.each([
    ['no state', undefined],
    ['state without from', { other: true }],
    ['a from without a pathname', { from: { search: '?x' } }],
    ['a from that is not a path', { from: { pathname: 'https://evil.example/' } }],
    ['a from that is a string', { from: '/users' }],
  ])('home for %s', async (_label, state) => {
    await render(tree(fakeAuth(), state))

    await expect.element(page.getByText('home page, navigation REPLACE')).toBeVisible()
  })
})
