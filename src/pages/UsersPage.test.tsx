import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { GraphQLError } from 'graphql'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { Observable, of, throwError } from 'rxjs'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../App.tsx'
import { GET_USERS } from '../users/queries.ts'
import type { GetUsersQuery } from '../types/__generated__/graphql.ts'
import '../index.css'

type Users = GetUsersQuery['users']
type Response = () => Observable<ApolloLink.Result>

function makeUsers(count: number): Users {
  return Array.from({ length: count }, (_, i) => ({
    __typename: 'User',
    id: `id-${i + 1}`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: 'viewer',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
  }))
}

const succeed = (users: Users) => () => of({ data: { users } })
const fail = () => throwError(() => new Error('Failed to fetch'))
const failInGraphQL = () => of({ errors: [new GraphQLError('boom')] })
const hang = () => new Observable<ApolloLink.Result>(() => {})

/** A response that the test settles by hand, to inspect the UI while the request is in flight. */
function deferred() {
  let settle: (users?: Users) => void = () => {}
  const respond = () =>
    new Observable<ApolloLink.Result>((observer) => {
      settle = (users) => {
        if (!users) return observer.error(new Error('Failed to fetch'))
        observer.next({ data: { users } })
        observer.complete()
      }
    })
  return { respond, succeed: (users: Users) => settle(users), fail: () => settle() }
}

async function renderUsers(...responses: Response[]) {
  return renderApp('/users', ...responses)
}

/** Renders the app at the route. Each request takes the next response, and the last one repeats. */
async function renderApp(route: string, ...responses: Response[]) {
  let requests = 0
  const link = new ApolloLink(() => responses[Math.min(requests++, responses.length - 1)]())
  const client = new ApolloClient({ link, cache: new InMemoryCache() })
  await render(
    <StrictMode>
      <ApolloProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </ApolloProvider>
    </StrictMode>,
  )
  return {
    requests: () => requests,
    refetch: () => client.refetchQueries({ include: [GET_USERS] }).catch(() => {}),
    setUsers: (users: Users) => client.writeQuery({ query: GET_USERS, data: { users } }),
  }
}

const firstNames = () =>
  [...document.querySelectorAll('tbody th')].map((cell) => cell.textContent)
const namesFrom = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, i) => `First${first + i}`)

async function expectRows(first: number, last: number) {
  await expect.poll(firstNames).toEqual(namesFrom(first, last))
}

const nextButton = () => page.getByRole('button', { name: 'Go to next page' })
const previousButton = () => page.getByRole('button', { name: 'Go to previous page' })
const retryButton = () => page.getByRole('button', { name: /^Retry/ })
const usersRegion = () => page.getByRole('region', { name: 'Users', exact: true })

async function selectPageSize(size: number) {
  await page.getByRole('combobox', { name: /Rows per page/ }).click()
  await page.getByRole('option', { name: String(size), exact: true }).click()
}

beforeEach(async () => {
  await page.viewport(1200, 900)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('table', () => {
  test('shows first name, last name, email and role', async () => {
    await renderUsers(succeed(makeUsers(1)))
    await expectRows(1, 1)

    const cells = [...document.querySelectorAll('tbody tr > *')].map((cell) => cell.textContent)
    expect(cells).toEqual(['First1', 'Last1', 'user1@example.com', 'viewer'])
  })

  test('is named and has readable column headers', async () => {
    await renderUsers(succeed(makeUsers(1)))

    await expect.element(page.getByRole('table', { name: 'Users table' })).toBeVisible()
    for (const name of ['First name', 'Last name', 'Email', 'Role']) {
      await expect.element(page.getByRole('columnheader', { name, exact: true })).toBeVisible()
    }
  })

  test('left-aligns text columns', async () => {
    await renderUsers(succeed(makeUsers(1)))
    await expectRows(1, 1)

    for (const cell of document.querySelectorAll('thead th, tbody tr > *')) {
      expect(getComputedStyle(cell).textAlign).toBe('left')
    }
  })

  test('keeps the server order', async () => {
    await renderUsers(succeed(makeUsers(4).reverse()))
    await expect.poll(firstNames).toEqual(['First4', 'First3', 'First2', 'First1'])
  })

  test('shows users with identical names as separate rows', async () => {
    const error = vi.spyOn(console, 'error')
    await renderUsers(succeed(makeUsers(3).map((user) => ({ ...user, firstName: 'Sam', lastName: 'Same' }))))

    await expect.poll(firstNames).toEqual(['Sam', 'Sam', 'Sam'])
    expect(error).not.toHaveBeenCalled()
  })

  test('does not log users', async () => {
    const log = vi.spyOn(console, 'log')
    await renderUsers(succeed(makeUsers(3)))

    await expectRows(1, 3)
    expect(log.mock.calls.filter(([message]) => message === 'Users')).toEqual([])
  })
})

describe('pagination', () => {
  test('shows 5 users by default', async () => {
    await renderUsers(succeed(makeUsers(12)))

    await expectRows(1, 5)
    await expect.element(page.getByText('1–5 of 12')).toBeVisible()
  })

  test('offers 5 and 10 rows per page', async () => {
    await renderUsers(succeed(makeUsers(12)))
    await page.getByRole('combobox').click()

    await expect
      .poll(() => [...document.querySelectorAll('[role=option]')].map((option) => option.textContent))
      .toEqual(['5', '10'])
  })

  test('goes forward to a partial last page and back', async () => {
    await renderUsers(succeed(makeUsers(12)))
    await expectRows(1, 5)
    await expect.element(previousButton()).toBeDisabled()

    await nextButton().click()
    await expectRows(6, 10)
    await expect.element(page.getByText('6–10 of 12')).toBeVisible()

    await nextButton().click()
    await expectRows(11, 12)
    await expect.element(nextButton()).toBeDisabled()

    await previousButton().click()
    await expectRows(6, 10)
  })

  test('has no second page for exactly one full page', async () => {
    await renderUsers(succeed(makeUsers(5)))

    await expectRows(1, 5)
    await expect.element(nextButton()).toBeDisabled()
  })

  test('puts one extra user on a second page', async () => {
    await renderUsers(succeed(makeUsers(6)))

    await nextButton().click()
    await expectRows(6, 6)
  })

  test('returns to the first page when the page size changes', async () => {
    await renderUsers(succeed(makeUsers(25)))
    await nextButton().click()
    await nextButton().click()
    await expectRows(11, 15)

    await selectPageSize(10)
    await expectRows(1, 10)
  })

  test('does not refetch when paging', async () => {
    const { requests } = await renderUsers(succeed(makeUsers(12)))
    await expectRows(1, 5)
    const before = requests()

    await nextButton().click()
    await expectRows(6, 10)
    expect(requests()).toBe(before)
  })

  test('keeps the page when a user is edited', async () => {
    const { setUsers } = await renderUsers(succeed(makeUsers(12)))
    await nextButton().click()
    await expectRows(6, 10)

    setUsers(makeUsers(12).map((user) => ({ ...user, role: 'editor' })))
    await expect.poll(() => document.querySelector('tbody')?.textContent).toContain('editor')
    await expectRows(6, 10)
  })

  test.each([
    { count: 3, first: 1, last: 3 },
    { count: 5, first: 1, last: 5 },
    { count: 6, first: 6, last: 6 },
    { count: 10, first: 6, last: 10 },
    { count: 11, first: 11, last: 11 },
  ])('shows a valid page when the list shrinks to $count', async ({ count, first, last }) => {
    const { setUsers } = await renderUsers(succeed(makeUsers(15)))
    await nextButton().click()
    await nextButton().click()
    await expectRows(11, 15)

    setUsers(makeUsers(count))
    await expectRows(first, last)
    await expect.element(page.getByText(`${first}–${last} of ${count}`, { exact: true })).toBeVisible()
  })
})

describe('loading and empty', () => {
  test('shows a named spinner, and no table or empty message, while loading', async () => {
    await renderUsers(hang)

    await expect.element(page.getByRole('progressbar', { name: 'Loading users' })).toBeVisible()
    await expect.element(page.getByRole('table')).not.toBeInTheDocument()
    await expect.element(page.getByText('No users found.')).not.toBeInTheDocument()
  })

  test('keeps the rows during a refetch', async () => {
    const { refetch, requests } = await renderUsers(succeed(makeUsers(3)), hang)
    await expectRows(1, 3)

    void refetch()
    await expect.poll(requests).toBe(2)
    await expectRows(1, 3)
    await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument()
  })

  test('shows a message instead of the table for an empty list', async () => {
    await renderUsers(succeed([]))

    await expect.element(page.getByText('No users found.')).toBeVisible()
    await expect.element(page.getByRole('table')).not.toBeInTheDocument()
  })

  test('shows the message when the list shrinks to empty', async () => {
    const { setUsers } = await renderUsers(succeed(makeUsers(6)))
    await nextButton().click()

    setUsers([])
    await expect.element(page.getByText('No users found.')).toBeVisible()
  })
})

describe('errors and retry', () => {
  test.each([
    { kind: 'network', response: fail },
    { kind: 'GraphQL', response: failInGraphQL },
  ])('shows an alert, and no table or empty message, for a $kind error', async ({ response }) => {
    await renderUsers(response)

    await expect.element(page.getByRole('alert')).toMatchTextContent('Could not load users.')
    await expect.element(page.getByRole('table')).not.toBeInTheDocument()
    await expect.element(page.getByText('No users found.')).not.toBeInTheDocument()
  })

  test('keeps the rows when a refetch fails', async () => {
    const { refetch } = await renderUsers(succeed(makeUsers(3)), fail)
    await expectRows(1, 3)

    await refetch()
    await expect.element(page.getByRole('alert')).toBeVisible()
    await expectRows(1, 3)
  })

  test('keeps focus on Retry while retrying and after it fails', async () => {
    const pending = deferred()
    const { requests } = await renderUsers(fail, pending.respond)
    await expect.element(retryButton()).toBeVisible()
    const button = retryButton().element() as HTMLButtonElement
    button.focus()

    await userEvent.keyboard('{Enter}')
    await expect.poll(requests).toBe(2)
    await expect.element(retryButton()).toHaveTextContent('Retrying…')
    await expect.element(retryButton()).toHaveFocus()
    await expect.element(page.getByRole('progressbar')).not.toBeInTheDocument()

    pending.fail()
    await expect.element(retryButton()).toHaveTextContent('Retry')
    // The same node, so it never unmounted.
    expect(retryButton().element()).toBe(button)
    await expect.element(retryButton()).toHaveFocus()
  })

  test('sends one request when Retry is pressed twice', async () => {
    const pending = deferred()
    const { requests } = await renderUsers(fail, pending.respond)
    await retryButton().click()
    await expect.element(retryButton()).toHaveTextContent('Retrying…')

    await userEvent.keyboard('{Enter}')
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(requests()).toBe(2)
    await expect.element(retryButton()).toHaveTextContent('Retrying…')

    pending.succeed(makeUsers(3))
    await expectRows(1, 3)
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    await expect.element(usersRegion()).toHaveFocus()
  })

  test('can retry again after a failed retry', async () => {
    await renderUsers(fail, fail, succeed(makeUsers(3)))
    await retryButton().click()
    await expect.element(retryButton()).toHaveTextContent('Retry')

    await retryButton().click()
    await expectRows(1, 3)
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
  })

  test.each([3, 0])('moves focus to the users section when retry returns %i users', async (count) => {
    await renderUsers(fail, succeed(makeUsers(count)))
    await retryButton().click()

    await expect.element(page.getByRole('alert')).not.toBeInTheDocument()
    await expect.element(usersRegion()).toHaveFocus()
  })

  test('does not take focus back if the user moved on during a retry', async () => {
    const pending = deferred()
    const { requests } = await renderUsers(fail, pending.respond)
    await retryButton().click()
    await expect.poll(requests).toBe(2)
    const link = page.getByRole('link', { name: 'About' })
    ;(link.element() as HTMLElement).focus()

    pending.succeed(makeUsers(3))
    await expectRows(1, 3)
    await expect.element(link).toHaveFocus()
  })
})

describe('layout and accessibility', () => {
  test.each([320, 375, 599, 600, 697])('fits pagination on screen at %ipx', async (width) => {
    await page.viewport(width, 800)
    await renderUsers(succeed(makeUsers(123).map((user) => ({ ...user, lastName: `${user.lastName}Wolfeschlegelsteinhausen` }))))
    await expectRows(1, 5)

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width)
    expect(nextButton().element().getBoundingClientRect().right).toBeLessThanOrEqual(width)
    await expect.element(page.getByRole('combobox')).toHaveAccessibleName(/Rows per page/)
  })

  test('lets keyboard users focus the scrollable table', async () => {
    await renderUsers(succeed(makeUsers(3)))

    await expect
      .element(page.getByRole('region', { name: 'Users table, scrollable' }))
      .toHaveAttribute('tabindex', '0')
  })

  test('has a main landmark and one h1', async () => {
    await renderUsers(succeed(makeUsers(3)))

    await expect.element(page.getByRole('main')).toBeVisible()
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })

  test('leaves space between the heading and the table', async () => {
    await renderUsers(succeed(makeUsers(3)))
    await expectRows(1, 3)

    const heading = page.getByRole('heading', { level: 1, name: 'Users' }).element().getBoundingClientRect()
    const card = document.querySelector('.MuiPaper-root:not(header)')!.getBoundingClientRect()
    expect(card.top - heading.bottom).toBeGreaterThanOrEqual(16)
  })
})

describe('navigation', () => {
  test('shows the table on Users and not on Home', async () => {
    await renderApp('/', succeed(makeUsers(3)))
    await expect.element(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
    await expect.element(page.getByRole('table')).not.toBeInTheDocument()

    await page.getByRole('link', { name: 'Users', exact: true }).click()
    await expectRows(1, 3)
  })
})
