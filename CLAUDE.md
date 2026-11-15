# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the frontend of a full-stack "user list" app: React 19, TypeScript, Vite, and MUI v9 (`@mui/material`) with Emotion for styling. The backend lives in the sibling `../UserListServer`, which is outside this repo and has no code yet. The project is still at the scaffolding stage: routing (react-router, declarative mode) and a responsive layout shell are in place, but the pages are placeholders.

## Commands

Node version is pinned in `.nvmrc` (v22.23.2).

- `npm run dev`: Vite dev server with HMR
- `npm run build`: `tsc -b` type-check, then `vite build` to `dist/`
- `npm run lint`: oxlint (config in `.oxlintrc.json`)
- `npm run preview`: serve the built `dist/`

No test runner is configured yet.

## Structure and config

- Entry point: `index.html` → `src/main.tsx` (renders `<App/>` inside `BrowserRouter` and `StrictMode`) → `src/App.tsx` (the `<Routes>` table).
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
