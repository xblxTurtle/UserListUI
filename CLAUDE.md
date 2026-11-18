# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the frontend of a full-stack "user list" app: React 19, TypeScript, Vite, and MUI v9 (`@mui/material`) with Emotion for styling. The backend is the GraphQL server in the sibling `../UserListServer`, which is outside this repo. The UI talks to it through Apollo Client 4. The project is still at the scaffolding stage: routing (react-router, declarative mode) and a responsive layout shell are in place, but the pages are placeholders. HomePage fetches the user list on mount and only logs it to the console for now.

## Commands

Node version is pinned in `.nvmrc` (v22.23.2).

- `npm run dev`: Vite dev server with HMR
- `npm run build`: `tsc -b` type-check, then `vite build` to `dist/`
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
  - `src/apollo/client.ts` creates the single `ApolloClient`. Its endpoint is `VITE_GRAPHQL_URL` (typed in `src/vite-env.d.ts`) and defaults to `http://localhost:4000/`. Start the server with `npm run dev` in `../UserListServer`.
  - Queries and their result types live by domain, for example `src/users/queries.ts` (`User` and `GET_USERS`). Type documents as `TypedDocumentNode` so `useQuery` infers `data`. The `User` type is written by hand to mirror the server schema.
  - Apollo Client 4 import paths: core (`ApolloClient`, `gql`, `HttpLink`) from `@apollo/client`, hooks and `ApolloProvider` from `@apollo/client/react`, and `MockedProvider` from `@apollo/client/testing/react`.
- All routes are nested under the pathless `src/layouts/MainLayout.tsx` (Header, `<Outlet/>` in a `<main>` Container, Footer). Pages live in `src/pages/`.
- Header links come from `src/navItems.ts`. To add a page, add an entry there and a `<Route>` in `App.tsx`. On `sm` and up the links render inline; below `sm` they move into a Drawer opened by a menu button.
- MUI v9 has no system props (`color`, `mt`, `align`, ...) on `Box`/`Typography`/`Stack`/etc. Use `sx`. Router links use `component={NavLink}` / `component={Link}`, and the active link is styled through `'&.active'` in `sx`.
- TypeScript uses project references: `tsconfig.app.json` covers `src/` and `tsconfig.node.json` covers `vite.config.ts`. It is TypeScript `~7.0` (the native Go-based compiler).
- The compiler settings are strict about some things:
  - `verbatimModuleSyntax`: type-only imports must use `import type`.
  - `erasableSyntaxOnly`: no `enum`, `namespace` or constructor parameter properties.
  - `noUnusedLocals` and `noUnusedParameters` are errors, so `npm run build` fails on unused variables and parameters.
  - Imports use explicit `.tsx`/`.ts` extensions (`allowImportingTsExtensions`).
- Lint uses the react, typescript and oxc plugins. `react/rules-of-hooks` is an error, and `react/only-export-components` is a warning (constant exports allowed), which keeps component files Fast Refresh friendly.
