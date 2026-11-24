import { ApolloProvider } from '@apollo/client/react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth.ts'
import { createApolloClient } from './client.ts'

/**
 * Provides the app's Apollo Client. It lives inside AuthProvider, so a 401 from /graphql can call the
 * auth `logout`. The client is created once; `logout` is stable, so the first render's copy is current.
 */
function AppApolloProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const [client] = useState(() => createApolloClient({ onUnauthorized: logout }))

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export default AppApolloProvider
