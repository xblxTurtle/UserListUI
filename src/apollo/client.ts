import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

/** The app-wide Apollo Client. It calls VITE_GRAPHQL_URL_PATH on the app's own origin, which Vite proxies to UserListServer. */
export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL_PATH }),
  cache: new InMemoryCache(),
})
