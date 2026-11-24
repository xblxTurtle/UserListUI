# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the frontend of a full-stack "user list" app: React 19, TypeScript, Vite, and MUI v9 (`@mui/material`) with Emotion for styling. The backend is the GraphQL server in the sibling `../UserListServer`, which is outside this repo. The UI talks to it through Apollo Client 4. Routing (react-router, declarative mode) and a responsive layout shell are in place. UsersPage shows the users in an MUI table with client-side pagination (the query returns the whole list), plus loading, error with retry, and empty states. HomePage and AboutPage are static text. LoginPage (`/login`) is a username and password form that is not connected to the API yet. `AuthProvider` (`src/auth/`) checks the session on mount and provides `login`. Every page except `/login` requires a logged-in user.

## Commands

Node version is pinned in `.nvmrc` (v22.23.2).

- `npm run dev`: Vite dev server with HMR
- `npm run build`: `codegen:check`, then `tsc -b` type-check, then `vite build` to `dist/`
- `npm run codegen`: regenerate GraphQL types (after editing a query or `schema.graphql`)
- `npm run schema:pull`: refresh `schema.graphql` from a running server
- `npm run lint`: oxlint (config in `.oxlintrc.json`)
- `npm run preview`: serve the built `dist/`

- `npm test`: behavior tests (Vitest browser mode, Playwright, headless Chromium)
- `npm run test:vrt`: visual regression tests (Vitest browser mode, Playwright, headless Chromium)
- `npm run test:vrt:update`: regenerate all reference screenshots after an intentional UI change

## Behavior tests

- The `behavior` project in `vitest.config.ts` picks up `src/**/*.test.{ts,tsx}`, except `*.vrt.test.tsx`. Files sit next to their source, for example `src/pages/UsersPage.test.tsx`. Use `.ts` for tests with no JSX, such as `src/auth/authApi.test.ts`.
- They assert on the DOM and take no screenshots. Each test builds its own Apollo Client with a fake link, so it controls success, failure and timing.
- Do not assert on MUI propTypes warnings (for example "page is out of range"). React 19 ignores propTypes, so they never fire. Assert on what is rendered.

## Visual regression tests

- Config is in `vitest.config.ts` (the `vrt` project, merged with `vite.config.ts`). The project picks up `src/**/*.vrt.test.tsx`, one file per component or page, next to its source.
- Reference screenshots are written to `screenshots/`, mirroring `src/`. For example, `src/components/Header.vrt.test.tsx` writes to `screenshots/components/Header/<name>-chromium-darwin.png`. Commit them.
- Each test captures the xs (375), md (900) and lg (1200) widths through `page.viewport()`. The `viewports` list lives in `src/test/vrt.tsx`.
- Use the helpers in `src/test/vrt.tsx`:
  - `renderWithRouter(ui, route, auth?)` for components that use `NavLink`/`Link`. It also provides `AuthContext`, logged in by default so the header shows its nav. Pass `loggedOut()` or `checkingSession()` from `src/test/auth.ts` for the other states, as `Header.vrt.test.tsx` does.
  - `renderPage(<XPage/>, route)` for pages. It renders them inside the real `MainLayout`, without the route guards, and the screenshot is taken with `bodyLocator()`. As a result, a Header or Footer change also fails every page test.
  - For a page that fetches, wait for its data before the screenshot, as `UsersPage.vrt.test.tsx` does. Otherwise it can capture the spinner.
  - `bodyLocator()` is also needed for portals such as the open Drawer.
- `renderWithRouter` (and so `renderPage`) also wraps the tree in Apollo's `MockedProvider` with the mocks in `src/test/vrt.tsx`. Tests never reach the network. When a component runs a new query, add a mock for it there. Otherwise the query errors and logs a "no more mocked responses" warning.
- `src/test/vrt.setup.ts` freezes `Date` before each test file loads, because Footer's © year is computed at module load.
- Screenshots depend on the OS (system fonts), so the file name carries the platform. Mac references won't match Linux CI.
- Screenshots for renamed or deleted tests are not removed automatically. Delete them by hand.
- Failed-run diffs and actual images go to `.vitest/`, which is gitignored.
- If Chromium is missing, run `npx playwright install chromium` once.

## Structure and config

- Entry point: `index.html` → `src/main.tsx` (renders `<App/>` inside `StrictMode` > `AuthProvider` > `AppApolloProvider` > `BrowserRouter`) → `src/App.tsx` (the `<Routes>` table). `AuthProvider` sits outside Apollo so a 401 from `/graphql` can log out.
- GraphQL:
  - Server address: three variables, with defaults only in the committed `.env`. Override them in `.env.local` (gitignored) or the shell, and do not add fallbacks in code.
    - `VITE_SERVER_URL`: the server's origin, `http://localhost:4000`.
    - `VITE_GRAPHQL_URL_PATH`: the GraphQL path, `/graphql`.
    - `VITE_API_URL_PATH`: the prefix of every REST route, `/api`.
  - The browser never calls the server directly. Apollo uses `VITE_GRAPHQL_URL_PATH` and `src/auth/authApi.ts` uses `VITE_API_URL_PATH`, both on the app's own origin. The Vite dev and preview servers proxy them to `VITE_SERVER_URL` (`vite.config.ts`):
    - Both are forwarded unchanged, to `VITE_SERVER_URL` + the path. The server serves GraphQL at `/graphql` and every REST route under `/api` (`/api/login`, `/api/session`).
    - The `/api` prefix also keeps the proxy off the UI's own `/login` page.
    - Because of the proxy, the session cookie lives on the UI's origin and needs no CORS credentials.
    - A production deployment needs the same forwarding.
  - `serverEnv.ts` reads the three variables (through Vite's `loadEnv`) for `vite.config.ts`, so the app and the proxy always use the same server.
  - Start the server with `npm run dev` in `../UserListServer`.
  - `src/apollo/client.ts` exports `createApolloClient({ onUnauthorized })`. It is a factory, not a module-level client.
    - Its `ErrorLink` reacts to any HTTP 401 (`ServerError.is(error) && error.statusCode === 401`): it calls `operation.client.clearStore()`, so the previous user's data is gone, then `onUnauthorized()`. Only the status counts; a GraphQL error code inside a 200 doesn't.
    - `src/apollo/AppApolloProvider.tsx` creates the one app client in `useState`, passing `useAuth().logout` as `onUnauthorized`, and provides it with `ApolloProvider`.
    - Tests still build their own clients: a fake link in `UsersPage.test.tsx`, `MockedProvider` in the visual tests. `client.test.ts` covers the 401 link with a stubbed `fetch`, and `AppApolloProvider.test.tsx` covers the whole flow end to end.
  - Queries live by domain, for example `GET_USERS` in `src/users/queries.ts`. Type each document as `TypedDocumentNode<XQuery, XQueryVariables>` with the generated types, so `useQuery` infers `data`. Never write GraphQL types by hand; derive them from the generated ones (e.g. `GetUsersQuery['users'][number]`).
  - Types come from GraphQL Code Generator. The server is a separate repo, so the client commits its own copy of the schema in `schema.graphql`:
    - `npm run schema:pull` (`codegen.schema.ts`) copies the schema from the server repo's SDL file, `../UserListServer/src/schema/typeDefs.graphql`, into `schema.graphql`. It doesn't need the server running, which matters because `/graphql` requires a session and introspection would get a 401. It assumes the repos sit side by side. Run it only when the server API changes, and commit the diff.
    - `npm run codegen` (`codegen.ts`) generates `src/types/__generated__/graphql.ts` from `schema.graphql` and the `gql` documents in `src/`. It needs no server. Never edit the generated file. Commit it.
    - `npm run codegen:check` fails if the generated file is out of date. `npm run build` runs it first, so a query edit without `npm run codegen` fails the build.
    - The codegen CLI needs the pinned Node 22 (it uses `fs.glob`). On Node 20 it crashes with "does not provide an export named 'glob'".
  - Apollo Client 4 import paths: core (`ApolloClient`, `gql`, `HttpLink`) from `@apollo/client`, hooks and `ApolloProvider` from `@apollo/client/react`, and `MockedProvider` from `@apollo/client/testing/react`.
- Auth (`src/auth/`):
  - `AuthProvider` wraps the app in `main.tsx`. On mount it calls `GET /api/session` once. Read the state with `useAuth()`, which returns `{ isLoading, isAuthenticated, username, login, logout }` and throws outside the provider.
  - `isLoading` is true only during that first session check. `login()` never sets it, so the form tracks its own pending state.
  - `login()` never rejects. It resolves to `{ ok: true }` or `{ ok: false, error: 'invalid-credentials' | 'network' | 'server' }`. A failed login leaves the state unchanged. On a 401 (`invalid-credentials`) the server also deletes any existing session cookie, so if `login()` were ever called while logged in, the next `/graphql` request would get a 401 and log out. In the app it can't happen, because `/login` is `GuestOnly`.
  - `logout()` logs out on the client only, because the server has no logout route. It is stable across renders. A GraphQL 401 calls it through `AppApolloProvider`, and `Protected` then sends the user to `/login` with `from`.
  - Login and logout both win over a session check that answers later.
  - The GraphQL 401 path clears the Apollo cache, in the link. A future Logout button that calls `logout()` should clear the cache itself.
  - A session check that fails (network or server error) counts as logged out.
  - The files are split so each component file exports only a component: `AuthContext.ts` (context and types), `AuthProvider.tsx`, `useAuth.ts`, and `authApi.ts` (the fetch calls).
  - `Protected` renders its children for a logged-in user. Anyone else gets `<Navigate to="/login" replace state={{ from: location }}/>`. `from` is the whole location (path, query and hash), kept for a post-login redirect that nothing reads yet.
  - `GuestOnly` is the reverse. It renders its children for a logged-out user and sends a logged-in user to `/` with `replace`.
  - While the session check runs, both show `AuthLoading`, an MUI `CircularProgress` labeled "Checking your session", inside `<main>`. So the header and footer stay up, and a logged-in user never sees the login form flash before the redirect.
  - The guards only react to the auth state. Nothing checks the session again, so a session that expires while the user is on a page goes unnoticed until the next full load.
  - The REST calls go to `VITE_API_URL_PATH` (`/api`) on the app's origin. See "Server address" above for how the proxy forwards them.
  - Tests that need a fixed auth state (the guards, `Header.test.tsx`, `App.test.tsx`, `UsersPage.test.tsx`) don't stub `fetch`. They provide `<AuthContext value={fakeAuth(...)}>` from `src/test/auth.ts`, which is logged in as `ada` by default, with `loggedOut()` and `checkingSession()` for the other states. A test that renders `<App/>` needs this, or every page redirects to `/login`.
  - The `AuthProvider` and `authApi` tests stub `fetch` with `vi.spyOn(globalThis, 'fetch')`. `src/auth/authApi.test.ts` covers the HTTP layer: the request each call sends, and how every status, network error and malformed body maps to a result. `src/auth/AuthProvider.test.tsx` covers the state on top of it.
- All routes are nested under the pathless `src/layouts/MainLayout.tsx` (Header, `<Outlet/>` in a `<main>` Container, Footer). Pages live in `src/pages/`.
- Route guards (`src/auth/`), both inside `MainLayout`:
  - Every page except `/login` sits in a pathless `<Protected><Outlet/></Protected>` route, the 404 page included.
  - `/login` is wrapped in `GuestOnly`.
  - Put a new private page inside the `Protected` group in `App.tsx`. Wrap a page meant only for logged-out users, such as a future register page, in `GuestOnly`.
- Header links come from `src/navItems.ts`. To add a page, add an entry there and a `<Route>` in `App.tsx`. On `sm` and up the links render inline; below `sm` they move into a Drawer opened by a menu button. The nav (links, menu button and Drawer) shows only when `useAuth().isAuthenticated`. While the session check runs, or when logged out, the header shows just the title.
- MUI v9 has no system props (`color`, `mt`, `align`, ...) on `Box`/`Typography`/`Stack`/etc. Use `sx`. Router links use `component={NavLink}` / `component={Link}`, and the active link is styled through `'&.active'` in `sx`.
- TypeScript uses project references: `tsconfig.app.json` covers `src/` and `tsconfig.node.json` covers the root config files (`vite.config.ts`, `vitest.config.ts`, `codegen*.ts`, `serverEnv.ts`). It is TypeScript `~7.0` (the native Go-based compiler).
- The compiler settings are strict about some things:
  - `verbatimModuleSyntax`: type-only imports must use `import type`.
  - `erasableSyntaxOnly`: no `enum`, `namespace` or constructor parameter properties.
  - `noUnusedLocals` and `noUnusedParameters` are errors, so `npm run build` fails on unused variables and parameters.
  - Imports use explicit `.tsx`/`.ts` extensions (`allowImportingTsExtensions`).
- Lint uses the react, typescript and oxc plugins. `react/rules-of-hooks` is an error, and `react/only-export-components` is a warning (constant exports allowed), which keeps component files Fast Refresh friendly.
