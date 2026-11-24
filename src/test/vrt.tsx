// Shared helpers for visual regression tests (*.vrt.test.tsx).
import type { MockLink } from '@apollo/client/testing'
import { MockedProvider } from '@apollo/client/testing/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import type { Auth } from '../auth/AuthContext.ts'
import { AuthContext } from '../auth/AuthContext.ts'
import MainLayout from '../layouts/MainLayout.tsx'
import { GET_USERS } from '../users/queries.ts'
import { fakeAuth } from './auth.ts'
import type { GetUsersQuery } from '../types/__generated__/graphql.ts'
import '../index.css'

const mockNames = [
  ['Ada', 'Lovelace'],
  ['Alan', 'Turing'],
  ['Grace', 'Hopper'],
  ['Edsger', 'Dijkstra'],
  ['Barbara', 'Liskov'],
  ['Donald', 'Knuth'],
  ['Katherine', 'Johnson'],
  ['Dennis', 'Ritchie'],
  ['Frances', 'Allen'],
  ['John', 'Backus'],
  ['Margaret', 'Hamilton'],
  ['Niklaus', 'Wirth'],
]

// More than two pages at the default 5 rows, so screenshots show working pagination.
const mockUsers: GetUsersQuery['users'] = mockNames.map(([firstName, lastName], i) => ({
  __typename: 'User',
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  firstName,
  lastName,
  email: `${firstName}.${lastName}@example.com`.toLowerCase(),
  role: i === 0 ? 'admin' : 'viewer',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}))

/** GraphQL mocks for every VRT render, so tests never reach the network. maxUsageCount covers StrictMode/re-renders. */
const graphqlMocks: MockLink.MockedResponse[] = [
  {
    request: { query: GET_USERS },
    result: { data: { users: mockUsers } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
]

/** Widths match MUI's default breakpoints. Below sm (600) the header shows the mobile menu button. */
export const viewports = [
  { name: 'xs', width: 375 },
  { name: 'md', width: 900 },
  { name: 'lg', width: 1200 },
]

/** Locator for the whole document body. Use it to capture full pages and portals such as the Drawer. */
export const bodyLocator = () => page.elementLocator(document.body)

/**
 * Renders a component inside a router at the given URL, so NavLink/Link work and the matching link is active.
 * Also provides a mocked Apollo Client, so components that run GraphQL queries render without a server, and
 * an auth state: logged in by default, so the header shows its nav. Pass `loggedOut()` etc. from ./auth.ts.
 */
export function renderWithRouter(ui: ReactNode, route = '/', auth: Auth = fakeAuth()) {
  return render(
    <MockedProvider mocks={graphqlMocks}>
      <AuthContext value={auth}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext>
    </MockedProvider>,
  )
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
