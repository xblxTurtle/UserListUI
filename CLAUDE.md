# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the frontend of a full-stack "user list" app: React 19, TypeScript, Vite, and MUI v9 (`@mui/material`) with Emotion for styling. The backend is the GraphQL server in the sibling `../UserListServer`, which is outside this repo. The UI talks to it through Apollo Client 4. The project is still at the scaffolding stage: routing (react-router, declarative mode) and a responsive layout shell are in place, but the pages are placeholders. HomePage fetches the user list on mount and only logs it to the console for now.

## Commands

Node version is pinned in `.nvmrc` (v22.23.2).

- `npm run dev`: Vite dev server with HMR
- `npm run build`: `codegen:check`, then `tsc -b` type-check, then `vite build` to `dist/`
- `npm run codegen`: regenerate GraphQL types (after editing a query or `schema.graphql`)
- `npm run schema:pull`: refresh `schema.graphql` from a running server
- `npm run lint`: oxlint (config in `.oxlintrc.json`)
- `npm run preview`: serve the built `dist/`

- `npm run test:vrt`: visual regression tests (Vitest browser mode, Playwright, headless Chromium)
- `npm run test:vrt:update`: regenerate all reference screenshots after an intentional UI change

## Visual regression tests

- Config is in `vitest.config.ts` (the `vrt` project, merged with `vite.config.ts`). The project picks up `src/**/*.vrt.test.tsx`, one file per component or page, next to its source.
- Reference screenshots are written to `screenshots/`, mirroring `src/`. For example, `src/components/Header.vrt.test.tsx` writes to `screenshots/components/Header/<name>-chromium-darwin.png`. Commit them.
- Each test captures the xs (375), md (900) and lg (1200) widths through `page.viewport()`. The `viewports` list lives in `src/test/vrt.tsx`.
- Use the helpers in `src/test/vrt.tsx`:
  - `renderWithRouter(ui, route)` for components that use `NavLink`/`Link`.
  - `renderPage(<XPage/>, route)` for pages. It renders them inside the real `MainLayout`, and the screenshot is taken with `bodyLocator()`. As a result, a Header or Footer change also fails every page test.
  - `bodyLocator()` is also needed for portals such as the open Drawer.
- `renderWithRouter` (and so `renderPage`) also wraps the tree in Apollo's `MockedProvider` with the mocks in `src/test/vrt.tsx`. Tests never reach the network. When a component runs a new query, add a mock for it there. Otherwise the query errors and logs a "no more mocked responses" warning.
- `src/test/vrt.setup.ts` freezes `Date` before each test file loads, because Footer's © year is computed at module load.
- Screenshots depend on the OS (system fonts), so the file name carries the platform. Mac references won't match Linux CI.
- Screenshots for renamed or deleted tests are not removed automatically. Delete them by hand.
- Failed-run diffs and actual images go to `.vitest/`, which is gitignored.
- If Chromium is missing, run `npx playwright install chromium` once.

## Structure and config

- Entry point: `index.html` → `src/main.tsx` (renders `<App/>` inside `StrictMode`, `ApolloProvider` and `BrowserRouter`) → `src/App.tsx` (the `<Routes>` table).
- GraphQL:
  - `src/apollo/client.ts` creates the single `ApolloClient`. Its endpoint is `VITE_GRAPHQL_URL` (typed in `src/vite-env.d.ts`). The default, `http://localhost:4000/`, lives only in the committed `.env`; override it in `.env.local` (gitignored) or the shell. Do not add fallbacks in code. `codegen.schema.ts` reads the same variable through Vite's `loadEnv`, so the app and the schema pull always use the same server. Start the server with `npm run dev` in `../UserListServer`.
  - Queries live by domain, for example `GET_USERS` in `src/users/queries.ts`. Type each document as `TypedDocumentNode<XQuery, XQueryVariables>` with the generated types, so `useQuery` infers `data`. Never write GraphQL types by hand; derive them from the generated ones (e.g. `GetUsersQuery['users'][number]`).
  - Types come from GraphQL Code Generator. The server is a separate repo, so the client commits its own copy of the schema in `schema.graphql`:
    - `npm run schema:pull` (`codegen.schema.ts`) fetches the schema from the running server at `VITE_GRAPHQL_URL` into `schema.graphql`. Run it only when the server API changes, and commit the diff.
    - `npm run codegen` (`codegen.ts`) generates `src/types/__generated__/graphql.ts` from `schema.graphql` and the `gql` documents in `src/`. It needs no server. Never edit the generated file. Commit it.
    - `npm run codegen:check` fails if the generated file is out of date. `npm run build` runs it first, so a query edit without `npm run codegen` fails the build.
    - The codegen CLI needs the pinned Node 22 (it uses `fs.glob`). On Node 20 it crashes with "does not provide an export named 'glob'".
  - Apollo Client 4 import paths: core (`ApolloClient`, `gql`, `HttpLink`) from `@apollo/client`, hooks and `ApolloProvider` from `@apollo/client/react`, and `MockedProvider` from `@apollo/client/testing/react`.
- All routes are nested under the pathless `src/layouts/MainLayout.tsx` (Header, `<Outlet/>` in a `<main>` Container, Footer). Pages live in `src/pages/`.
- Header links come from `src/navItems.ts`. To add a page, add an entry there and a `<Route>` in `App.tsx`. On `sm` and up the links render inline; below `sm` they move into a Drawer opened by a menu button.
- MUI v9 has no system props (`color`, `mt`, `align`, ...) on `Box`/`Typography`/`Stack`/etc. Use `sx`. Router links use `component={NavLink}` / `component={Link}`, and the active link is styled through `'&.active'` in `sx`.
- TypeScript uses project references: `tsconfig.app.json` covers `src/` and `tsconfig.node.json` covers the root config files (`vite.config.ts`, `vitest.config.ts`, `codegen*.ts`). It is TypeScript `~7.0` (the native Go-based compiler).
- The compiler settings are strict about some things:
  - `verbatimModuleSyntax`: type-only imports must use `import type`.
  - `erasableSyntaxOnly`: no `enum`, `namespace` or constructor parameter properties.
  - `noUnusedLocals` and `noUnusedParameters` are errors, so `npm run build` fails on unused variables and parameters.
  - Imports use explicit `.tsx`/`.ts` extensions (`allowImportingTsExtensions`).
- Lint uses the react, typescript and oxc plugins. `react/rules-of-hooks` is an error, and `react/only-export-components` is a warning (constant exports allowed), which keeps component files Fast Refresh friendly.
