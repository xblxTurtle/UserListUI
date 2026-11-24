import { afterEach, describe, expect, test, vi } from 'vitest'
import type { GetUsersQuery } from '../types/__generated__/graphql.ts'
import { GET_USERS } from '../users/queries.ts'
import { createApolloClient } from './client.ts'

const users: GetUsersQuery['users'] = [
  {
    __typename: 'User',
    id: 'id-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

const json = (status: number, body: unknown) => () =>
  Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
const UNAUTHENTICATED = {
  errors: [{ message: 'Not logged in', extensions: { code: 'UNAUTHENTICATED' } }],
}

/** Stubs fetch with one response for every request and records the request paths. */
function stubFetch(respond: () => Promise<Response>) {
  const paths: string[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    paths.push(new URL(new Request(input, init).url).pathname)
    return respond()
  })
  return paths
}

/** A client whose cache already holds the users list, as after a successful load. */
function clientWithCachedUsers() {
  const onUnauthorized = vi.fn()
  const client = createApolloClient({ onUnauthorized })
  client.writeQuery({ query: GET_USERS, data: { users } })
  return { client, onUnauthorized }
}

const queryFromNetwork = (client: ReturnType<typeof createApolloClient>) =>
  client.query({ query: GET_USERS, fetchPolicy: 'network-only' }).catch((error: unknown) => error)

const cachedUsers = (client: ReturnType<typeof createApolloClient>) =>
  client.readQuery({ query: GET_USERS })?.users ?? null

afterEach(() => {
  vi.restoreAllMocks()
})

test('sends GraphQL to /graphql on the app origin', async () => {
  const paths = stubFetch(json(200, { data: { users } }))
  const { client } = clientWithCachedUsers()

  await queryFromNetwork(client)

  expect(paths).toEqual(['/graphql'])
})

describe('a 401 response', () => {
  test('calls onUnauthorized once', async () => {
    stubFetch(json(401, UNAUTHENTICATED))
    const { client, onUnauthorized } = clientWithCachedUsers()

    await queryFromNetwork(client)

    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  test('clears the cache, so the previous user data is gone', async () => {
    stubFetch(json(401, UNAUTHENTICATED))
    const { client } = clientWithCachedUsers()
    expect(cachedUsers(client)).toHaveLength(1)

    await queryFromNetwork(client)

    await vi.waitFor(() => expect(cachedUsers(client)).toBeNull())
  })

  test('still fails the query', async () => {
    stubFetch(json(401, UNAUTHENTICATED))
    const { client } = clientWithCachedUsers()

    expect(await queryFromNetwork(client)).toBeInstanceOf(Error)
  })
})

describe('other responses leave the session and the cache alone', () => {
  test.each([
    ['200 with data', json(200, { data: { users } })],
    ['500', json(500, { errors: [{ message: 'boom' }] })],
    ['403', json(403, { errors: [{ message: 'Forbidden' }] })],
    ['200 with an UNAUTHENTICATED GraphQL error (only the status counts)', json(200, UNAUTHENTICATED)],
    ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])('%s', async (_label, respond) => {
    stubFetch(respond)
    const { client, onUnauthorized } = clientWithCachedUsers()

    await queryFromNetwork(client)

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(cachedUsers(client)).toHaveLength(1)
  })
})
