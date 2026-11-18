interface ImportMetaEnv {
  /** GraphQL endpoint of UserListServer. Defaults to http://localhost:4000/ when unset. */
  readonly VITE_GRAPHQL_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
