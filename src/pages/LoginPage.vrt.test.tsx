import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { loggedOut } from '../test/auth.ts'
import { bodyLocator, renderPage, viewports } from '../test/vrt.tsx'
import LoginPage from './LoginPage.tsx'

// Logged out, as anyone who sees this page is: the header shows only the title.
const wrongCredentials = {
  ...loggedOut(),
  login: async () => ({ ok: false, error: 'invalid-credentials' }) as const,
}

describe('LoginPage', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<LoginPage />, '/login', loggedOut())
    // The username field is auto-focused; blur it so the caret doesn't make screenshots flaky.
    ;(document.activeElement as HTMLElement | null)?.blur()

    await expect.element(bodyLocator()).toMatchScreenshot(`login-page-${name}`)
  })

  test.each(viewports)('$name with empty fields reported', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<LoginPage />, '/login', loggedOut())

    await page.getByRole('button', { name: 'Log in' }).click()
    await expect.element(page.getByText('Enter your password')).toBeVisible()
    ;(document.activeElement as HTMLElement | null)?.blur()

    await expect.element(bodyLocator()).toMatchScreenshot(`login-page-empty-fields-${name}`)
  })

  test.each(viewports)('$name with wrong credentials', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<LoginPage />, '/login', wrongCredentials)

    await page.getByRole('textbox', { name: /^Username/ }).fill('ada')
    await page.getByLabelText(/^Password/).fill('wrong')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect.element(page.getByRole('alert')).toBeVisible()
    ;(document.activeElement as HTMLElement | null)?.blur()

    await expect.element(bodyLocator()).toMatchScreenshot(`login-page-wrong-credentials-${name}`)
  })
})
