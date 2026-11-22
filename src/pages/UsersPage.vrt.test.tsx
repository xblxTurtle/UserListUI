import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { bodyLocator, renderPage, viewports } from '../test/vrt.tsx'
import UsersPage from './UsersPage.tsx'

describe('UsersPage', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<UsersPage />, '/users')
    // The mock responds asynchronously. Without this wait the screenshot can catch the spinner.
    await expect.element(page.getByRole('rowheader', { name: 'Ada' })).toBeVisible()

    await expect.element(bodyLocator()).toMatchScreenshot(`users-page-${name}`)
  })
})
