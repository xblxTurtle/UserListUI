import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { bodyLocator, renderPage, viewports } from '../test/vrt.tsx'
import HomePage from './HomePage.tsx'

describe('HomePage', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    await renderPage(<HomePage />, '/')

    await expect.element(bodyLocator()).toMatchScreenshot(`home-page-${name}`)
  })
})
