import { ApolloClient, HttpLink, InMemoryCache, ServerError } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'

/**
 * Creates the app's Apollo Client. It calls VITE_GRAPHQL_URL_PATH on the app's own origin, which Vite
 * proxies to UserListServer.
 *
 * On any HTTP 401 (the session is missing or expired) it clears the cache, so the previous user's data
 * is gone, and calls `onUnauthorized`. Only the status counts, not GraphQL error codes in a 200.
 * The app creates one client in AppApolloProvider, where `onUnauthorized` is the auth `logout`.
 */
export function createApolloClient({ onUnauthorized }: { onUnauthorized: () => void }) {
  const unauthorizedLink = new ErrorLink(({ error, operation }) => {
    if (ServerError.is(error) && error.statusCode === 401) {
      // clearStore rejects the queries still in flight; they fail anyway, so ignore that.
      operation.client.clearStore().catch(() => {})
      onUnauthorized()
    }
  })

  return new ApolloClient({
    link: unauthorizedLink.concat(new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL_PATH })),
    cache: new InMemoryCache(),
  })
}
