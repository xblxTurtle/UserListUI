import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

/** The app-wide Apollo Client, connected to UserListServer at VITE_GRAPHQL_URL (default in .env). */
export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: import.meta.env.VITE_GRAPHQL_URL }),
  cache: new InMemoryCache(),
})
