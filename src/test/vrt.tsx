// Shared helpers for visual regression tests (*.vrt.test.tsx).
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import MainLayout from '../layouts/MainLayout.tsx'
import '../index.css'

/** Widths match MUI's default breakpoints. Below sm (600) the header shows the mobile menu button. */
export const viewports = [
  { name: 'xs', width: 375 },
  { name: 'md', width: 900 },
  { name: 'lg', width: 1200 },
]

/** Locator for the whole document body. Use it to capture full pages and portals such as the Drawer. */
export const bodyLocator = () => page.elementLocator(document.body)

/** Renders a component inside a router at the given URL, so NavLink/Link work and the matching link is active. */
export function renderWithRouter(ui: ReactNode, route = '/') {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

/** Renders a page inside the real MainLayout (header, content, footer) at the given URL. */
export function renderPage(pageElement: ReactNode, route: string) {
  return renderWithRouter(
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="*" element={pageElement} />
      </Route>
    </Routes>,
    route,
  )
}
