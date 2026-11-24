import { loadEnv } from 'vite'

// Where UserListServer is, for the Vite proxy (vite.config.ts).
// Read from the shell or the .env files Vite loads in development mode. The defaults are in .env.
// The browser never calls VITE_SERVER_URL itself: it calls the two paths on its own origin, and the
// Vite dev and preview servers proxy them to the server (see vite.config.ts).

const env = loadEnv('development', process.cwd(), 'VITE_')

function required(name: string): string {
  const value = env[name]
  if (!value) throw new Error(`${name} is not set. It should come from .env.`)
  return value
}

/** Origin of UserListServer, e.g. http://localhost:4000. */
export const serverUrl = required('VITE_SERVER_URL')
/** Path of the GraphQL endpoint, the same on the UI origin and on the server, e.g. /graphql. */
export const graphqlPath = required('VITE_GRAPHQL_URL_PATH')
/** Prefix of every REST route, the same on the UI origin and on the server, e.g. /api. */
export const apiPath = required('VITE_API_URL_PATH')
