import type { CodegenConfig } from '@graphql-codegen/cli'
import { graphqlPath, serverUrl } from './serverEnv.ts'

// `npm run schema:pull`: copies the schema from a running UserListServer into schema.graphql.
// The server lives in a separate repo, so the client keeps its own committed copy of the schema.
// Re-run this only when the server API changes, and commit the schema.graphql diff together with the regenerated types.

// Same server as the app: VITE_SERVER_URL + VITE_GRAPHQL_URL_PATH (see serverEnv.ts). Node calls the server
// directly, with no proxy.
const config: CodegenConfig = {
  schema: `${serverUrl}${graphqlPath}`,
  generates: {
    'schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
}

export default config
