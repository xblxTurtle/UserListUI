import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { bodyLocator, renderPage, viewports } from '../test/vrt.tsx'
import AboutPage from './AboutPage.tsx'

describe('AboutPage', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<AboutPage />, '/about')

    await expect.element(bodyLocator()).toMatchScreenshot(`about-page-${name}`)
  })
})
