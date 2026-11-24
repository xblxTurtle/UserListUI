import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import AppApolloProvider from './apollo/AppApolloProvider.tsx'
import App from './App.tsx'
import AuthProvider from './auth/AuthProvider.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Auth outside Apollo, so a 401 from /graphql can log out. */}
    <AuthProvider>
      <AppApolloProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppApolloProvider>
    </AuthProvider>
  </StrictMode>,
)
