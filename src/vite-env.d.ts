interface ImportMetaEnv {
  /** GraphQL endpoint path on the app's origin, proxied to the server. Default in .env. */
  readonly VITE_GRAPHQL_URL_PATH: string
  /** Prefix of every REST route on the app's origin, proxied unchanged to the server. Default in .env. */
  readonly VITE_API_URL_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
