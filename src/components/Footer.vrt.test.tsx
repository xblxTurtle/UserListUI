import { describe, expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { viewports } from '../test/vrt.tsx'
import Footer from './Footer.tsx'

describe('Footer', () => {
  test.each(viewports)('$name', async ({ name, width }) => {
    await page.viewport(width, 800)
    const screen = await render(<Footer />)

    await expect.element(screen.getByRole('contentinfo')).toMatchScreenshot(`footer-${name}`)
  })
})
