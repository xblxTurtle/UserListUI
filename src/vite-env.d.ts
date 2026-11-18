interface ImportMetaEnv {
  /** GraphQL endpoint of UserListServer. The default is in .env. */
  readonly VITE_GRAPHQL_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
