import type { CodegenConfig } from '@graphql-codegen/cli'

// `npm run codegen`: generates operation types from the committed schema.graphql and the gql documents in src/.
// Needs no running server. To update schema.graphql, see codegen.schema.ts.
const config: CodegenConfig = {
  overwrite: true,
  schema: 'schema.graphql',
  documents: ['src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    'src/types/__generated__/graphql.ts': {
      plugins: ['typescript-operations'],
      config: {
        // Apollo Client's cache adds `__typename` to every selection set...
        nonOptionalTypename: true,
        // ...but not to root operation types (Query, Mutation).
        skipTypeNameForRoot: true,
      },
    },
  },
}

export default config
