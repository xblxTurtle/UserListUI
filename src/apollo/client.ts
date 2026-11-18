import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/'

/** The app-wide Apollo Client, connected to UserListServer. */
export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL }),
  cache: new InMemoryCache(),
})
