import type { CodegenConfig } from '@graphql-codegen/cli'

// `npm run schema:pull`: copies the schema from the sibling UserListServer repo into schema.graphql.
// The server's SDL file is its source of truth (the server is schema-first), so this needs no running
// server and no login, although /graphql now requires a session. It assumes the two repos sit side by side.
// Re-run this only when the server API changes, and commit the schema.graphql diff together with the regenerated types.
const config: CodegenConfig = {
  schema: '../UserListServer/src/schema/typeDefs.graphql',
  generates: {
    'schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
}

export default config
