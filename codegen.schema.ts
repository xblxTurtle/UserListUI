import type { CodegenConfig } from '@graphql-codegen/cli'
import { loadEnv } from 'vite'

// `npm run schema:pull`: copies the schema from a running UserListServer into schema.graphql.
// The server lives in a separate repo, so the client keeps its own committed copy of the schema.
// Re-run this only when the server API changes, and commit the schema.graphql diff together with the regenerated types.

// Same endpoint as the app (src/apollo/client.ts): VITE_GRAPHQL_URL from the shell or the .env files Vite loads in development mode.
const { VITE_GRAPHQL_URL } = loadEnv('development', process.cwd(), 'VITE_')
if (!VITE_GRAPHQL_URL) throw new Error('VITE_GRAPHQL_URL is not set. It should come from .env.')

const config: CodegenConfig = {
  schema: VITE_GRAPHQL_URL,
  generates: {
    'schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
}

export default config
