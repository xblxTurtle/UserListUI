import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { bodyLocator, renderPage, viewports } from '../test/vrt.tsx'
import NotFoundPage from './NotFoundPage.tsx'

describe('NotFoundPage', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<NotFoundPage />, '/does-not-exist')

    await expect.element(bodyLocator()).toMatchScreenshot(`not-found-page-${name}`)
  })
})
