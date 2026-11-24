import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { loggedOut } from '../test/auth.ts'
import { bodyLocator, renderWithRouter, viewports } from '../test/vrt.tsx'
import Header from './Header.tsx'

describe('Header', () => {
  // Logged in (the renderWithRouter default): title plus nav.
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    const screen = await renderWithRouter(<Header />)

    await expect.element(screen.getByRole('banner')).toMatchScreenshot(`header-${name}`)
  })

  // The menu button and Drawer only exist below sm, so the open drawer is captured at xs only.
  test('xs with drawer open', async () => {
    await page.viewport(375, 667)
    const screen = await renderWithRouter(<Header />)

    await screen.getByRole('button', { name: 'open navigation menu' }).click()
    await expect.element(page.getByRole('link', { name: 'Users' })).toBeVisible()

    // The Drawer renders in a portal on <body>, outside the header, so capture the whole viewport.
    await expect.element(bodyLocator()).toMatchScreenshot('header-xs-drawer-open')
  })

  // Logged out: the title only, with no nav links and no menu button.
  test.each(viewports)('$name logged out', async ({ name, width }) => {
    await page.viewport(width, 800)
    const screen = await renderWithRouter(<Header />, '/login', loggedOut())

    await expect.element(screen.getByRole('banner')).toMatchScreenshot(`header-logged-out-${name}`)
  })
})
