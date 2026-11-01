# 5. Build and test with Vite, TypeScript 7, Oxlint, Vitest and Playwright

Date: 2026-10-31
Status: Accepted

## Context

Every later issue builds on the scaffold (issue #4). The Stop hook runs `npm run check` at the end of nearly every turn, so it has to stay fast as the code grows. The reading logic has to stay separate from the UI (ADR 0003), and a violation should fail the turn it happens in, not wait for review. The app is iPhone first, but iPhone Safari can't run in the dev container. The firewall blocks Playwright's browser download host (ADR 0004).

The issue planned to start from Vite's official `react-ts` template and expected it to bring ESLint. The template in create-vite 9.3.3 ships Oxlint and TypeScript 7 instead. ESLint reads TypeScript through typescript-eslint, which borrows TypeScript's own parser; typescript-eslint 8.72 supports only TypeScript below 6.1, because TypeScript 7 was rewritten in Go and its API for other tools isn't usable yet. Keeping ESLint would have meant pinning TypeScript to 6.0.

## Decision

- **Build:** Vite with the React plugin, from the `react-ts` template of create-vite 9.3.3. `npm run build` typechecks, then writes a static site to `dist/`.
- **Typecheck:** TypeScript 7 with `tsc -b` over four projects, each with incremental build info cached in `node_modules/.tmp`:
  - `tsconfig.core.json` for `src/core`;
  - `tsconfig.app.json` for `src/ui`;
  - `tsconfig.node.json` for configs and `tests/`;
  - `tsconfig.e2e.json` for `e2e/`, which also has the DOM library, because callbacks passed to `page.evaluate` run in the browser.
- **Lint:** Oxlint, as the template ships it, with `--deny-warnings`. It reads TypeScript itself, so it works with TypeScript 7, and it's fast enough that the Stop hook doesn't notice it. The owner chose it over ESLint with TypeScript 6.0. The dev container's editor uses the Oxc extension (`oxc.oxc-vscode`) and fixes on save with `source.fixAll.oxc`.
- **Formatting:** Prettier with its defaults, the formatter VS Code runs on save in the dev container. `npm run check` runs `prettier --check`, so code written outside the editor stays formatted too.
- **Unit tests:** Vitest in plain Node, without DOM emulation, so tests start fast. It runs tests only in `src/core`, `src/ui` and `tests/`, the folders a tsconfig project typechecks, so no test runs without a typecheck.
- **`npm run check`** runs the typecheck, lint, format check and unit tests, with no build and no browser. `npm test` runs `npm run check`, so GitHub's Node.js workflow (`npm ci`, `npm run build`, `npm test`) covers all of it.
- **Core/UI boundary, enforced in two layers, because each catches what the other can't:**
  - `tsconfig.core.json` has `lib: ["ES2023"]` without `DOM`, and `types: []`. `document`, `window`, `localStorage` and every other browser or Node global fail the typecheck in `src/core`. This covers all browser APIs, not a hand-kept list.
  - `.oxlintrc.json` applies `no-restricted-imports` to `src/core/**`: no `react`, `react-dom` or any path into `ui/`. TypeScript alone would resolve those imports without complaint.
- **Browser tests:** Playwright runs `e2e/` against the production build served by `vite preview`, in two projects. It builds and starts the server itself on every run and never reuses one already on the port, which might serve an old build:
  - headless Chromium (Desktop Chrome);
  - WebKit with Playwright's iPhone 16 emulation (viewport, touch, mobile user agent).
- **Why WebKit:** the owner chose it. It's the closest automated stand-in for iPhone Safari, so it catches engine-level differences: CSS and layout, JavaScriptCore, missing or different web APIs. It doesn't catch iOS-only behaviour: the Home Screen app, the on-screen keyboard, safe areas, touch feel, storage limits, the Files picker or device speed. Playwright's Linux WebKit is also newer than Safari on iOS 18.4, so it can pass a feature the phone lacks. Device checks stay the final word.
- **Browsers in the image:** the Dockerfile installs Chromium's headless shell and WebKit, with their system libraries, as root during the image build, into `/ms-playwright` (`PLAYWRIGHT_BROWSERS_PATH`), readable by the `node` user. The headless shell is enough, since the container has no display. The version comes from the `PLAYWRIGHT_VERSION` build arg in `devcontainer.json`.
- **Pinned Playwright:** `package.json` pins `@playwright/test` exactly (no `^` or `~`). `tests/tooling/playwright-version.test.ts` fails `npm run check` if the pin isn't exact or differs from `PLAYWRIGHT_VERSION`.
- **CI:** GitHub's official Node.js workflow, added by the owner, on Node 24 only, the container's version. Node runs only the build and test tools, never the app. It also installs Playwright's browsers and runs `npm run e2e`, so UI breakage blocks a merge even if a session skipped the browser tests.

## Consequences

- A warm `npm run check` takes about a second today.
- A file in `src/core` that touches the browser, React or `src/ui` fails `npm run check` with an error that points to ARCHITECTURE.md.
- To bump Playwright:
  1. Change `@playwright/test` in `package.json` and `PLAYWRIGHT_VERSION` in `.devcontainer/devcontainer.json` to the same exact version, in one commit.
  2. Run `npm install` to update the lockfile.
  3. Ask the owner to rebuild the dev container.

  Until the rebuild, `npm run e2e` can't find the new browsers.

- The image grows by Chromium's headless shell, WebKit and their libraries, and e2e takes about twice as long with two browsers.
- Revisit ESLint only if Oxlint lacks a rule the project needs and typescript-eslint supports TypeScript 7 by then.
- `devcontainer.json` must stay plain JSON (no comments), because the version check parses it with `JSON.parse`.
