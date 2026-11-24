import { MemoryRouter } from 'react-router'
import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import type { Auth } from '../auth/AuthContext.ts'
import { AuthContext } from '../auth/AuthContext.ts'
import { checkingSession, fakeAuth, loggedOut } from '../test/auth.ts'
import Header from './Header.tsx'

const navLabels = ['Home', 'Users', 'About']

async function renderHeader(auth: Auth, width: number) {
  await page.viewport(width, 800)
  return render(
    <AuthContext value={auth}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AuthContext>,
  )
}

const title = () => page.getByRole('link', { name: 'User List' })
const menuButton = () => page.getByRole('button', { name: 'open navigation menu' })
const navLink = (label: string) => page.getByRole('link', { name: label, exact: true })

describe('desktop (sm and up)', () => {
  test('shows the nav links to a logged-in user', async () => {
    await renderHeader(fakeAuth(), 900)

    for (const label of navLabels) await expect.element(navLink(label)).toBeVisible()
  })

  test.each([
    ['logged out', loggedOut()],
    ['checking the session', checkingSession()],
  ])('hides the nav when %s, but keeps the title', async (_label, auth) => {
    await renderHeader(auth, 900)

    await expect.element(title()).toBeVisible()
    for (const label of navLabels) await expect.element(navLink(label)).not.toBeInTheDocument()
    await expect.element(page.getByRole('navigation')).not.toBeInTheDocument()
  })
})

describe('mobile (below sm)', () => {
  test('shows the menu button to a logged-in user, and it opens the nav', async () => {
    await renderHeader(fakeAuth(), 375)

    await menuButton().click()

    for (const label of navLabels) await expect.element(navLink(label)).toBeVisible()
  })

  test.each([
    ['logged out', loggedOut()],
    ['checking the session', checkingSession()],
  ])('hides the menu button when %s, but keeps the title', async (_label, auth) => {
    await renderHeader(auth, 375)

    await expect.element(title()).toBeVisible()
    await expect.element(menuButton()).not.toBeInTheDocument()
  })
})

test('shows the nav once the session check finds a session', async () => {
  const { rerender } = await renderHeader(checkingSession(), 900)
  await expect.element(navLink('Users')).not.toBeInTheDocument()

  await rerender(
    <AuthContext value={fakeAuth()}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AuthContext>,
  )

  await expect.element(navLink('Users')).toBeVisible()
})
