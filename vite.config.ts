import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'
import { apiPath, graphqlPath, serverUrl } from './serverEnv.ts'

// The browser sends every server request to its own origin, and the dev and preview servers forward it
// to UserListServer (VITE_SERVER_URL). The session cookie then belongs to the UI's origin, so no CORS
// credentials are needed.
// Both paths are forwarded unchanged: VITE_SERVER_URL + VITE_GRAPHQL_URL_PATH for GraphQL, and
// VITE_SERVER_URL + VITE_API_URL_PATH for every REST route. The /api prefix also keeps the proxy off
// the UI's own /login page.
const proxy: Record<string, ProxyOptions> = {
  [graphqlPath]: { target: serverUrl },
  [apiPath]: { target: serverUrl },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
