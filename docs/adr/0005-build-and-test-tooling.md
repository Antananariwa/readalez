# 5. Build and test with Vite, TypeScript 7, Oxlint, Vitest and Playwright

Date: 2026-10-31
Status: Accepted

## Context

- The Stop hook runs `npm run check` at the end of nearly every turn (ADR 0003), so the check has to stay fast as the code grows.
- Core's boundary (ADR 0003) should fail the turn that breaks it, not wait for review.
- The app runs on iPhone, Android and desktop browsers ([SPEC.md, Devices and browsers](../../SPEC.md#devices-and-browsers)). The dev container runs Linux, so neither phone's browser runs there. Playwright doesn't drive Safari itself either, "since it relies on patches" ([Playwright, Browsers](https://playwright.dev/docs/browsers#webkit)).
- Vite's `react-ts` template in create-vite 9.3.3 ships Oxlint and TypeScript 7 ([its `package.json`](https://github.com/vitejs/vite/blob/create-vite%409.3.3/packages/create-vite/template-react-ts/package.json)).
- ESLint reads TypeScript through typescript-eslint. Its 8.74.0 release supports only TypeScript `>=4.8.4 <6.1.0` ([its `package.json`](https://github.com/typescript-eslint/typescript-eslint/blob/v8.74.0/packages/typescript-eslint/package.json#L59-L62)). So ESLint would hold TypeScript at 6.0.

## Decision

- **Build:** Vite builds the app with the React plugin, from that template. `npm run build` typechecks, then writes a static site to `dist/`.
- **Typecheck:** `tsc -b` runs TypeScript 7, with `src/core/` as a project of its own (`tsconfig.core.json`).
- **Lint:** Oxlint lints with `--deny-warnings`. It reads TypeScript itself, so it works with TypeScript 7. ESLint loses, because it would hold TypeScript back.
- **Format:** Prettier formats with its defaults, as the dev container's editor does on save. `npm run check` runs `prettier --check`, so code written outside the editor stays formatted too.
- **Unit tests:** Vitest runs them in plain Node, with no DOM emulation, so they start fast.
- **Core's boundary, enforced in two layers, since each catches what the other can't:**
  - `tsconfig.core.json` has `lib: ["ES2023"]` with no DOM library, and `types: []`. So a browser or Node global that `src/core/webApis.d.ts` doesn't declare fails the typecheck.
  - `.oxlintrc.json` bans imports of React and of `ui/` in `src/core/**`. TypeScript alone would resolve those imports without complaint.
- **Browser tests:** Playwright runs `e2e/` against the production build that `vite preview` serves, in four projects:
  - **Chromium** runs with Playwright's Desktop Chrome preset.
  - **WebKit** runs with Playwright's iPhone 16 preset, for iPhone Safari. Playwright's WebKit "is derived from the latest WebKit main branch sources, often before these updates are incorporated into Apple Safari" ([Playwright, Browsers](https://playwright.dev/docs/browsers#webkit)). So it catches differences in the engine, such as CSS and layout, JavaScriptCore, and missing or different web APIs. It can also pass a feature that the phone's older Safari lacks.
  - **Chromium** also runs with the `Galaxy S24` and `Pixel 7` presets, for Android Chrome: a 360 px phone and a 412 px one. 360 px is narrower than the 375 px that [SPEC.md feature 5](../../SPEC.md#text-size) uses. No real Android browser runs in these checks ([known issue](../known-issues.md#android-is-checked-only-by-emulation)).
- **Browsers in the image:** the Dockerfile installs Chromium's headless shell and WebKit, with their system libraries, as root while it builds the image. The libraries need root, which the `node` user doesn't have at run time. `package.json` pins `@playwright/test` to the image's version.
- **CI:** CI runs GitHub's [starter Node.js workflow](https://github.com/actions/starter-workflows/blob/main/ci/node.js.yml), in which `npm test` runs `npm run check`. It runs on Node 24 only, the container's version, since Node runs only the build and test tools, never the app. It also runs `npm run e2e`, so a broken UI blocks a merge even when a session skipped the browser tests.

## Consequences

- A file in `src/core/` that imports React or `src/ui/` fails the lint. One that uses an undeclared global fails the typecheck. Either fails `npm run check`.
- Each Playwright project runs the suite again, so each one adds to the time `npm run e2e` takes. The browsers and their libraries add to the image's size.
- A Playwright bump needs the owner to rebuild the dev container. Until then, `npm run e2e` can't find the new browsers (`tests/tooling/playwright-version.test.ts`).
- WebKit misses what only an iPhone shows, such as the installed app, the on-screen keyboard, safe areas, touch feel, storage limits, the file picker and device speed. Only device checks on the iPhone can see those ([SPEC.md, How features are checked](../../SPEC.md#how-features-are-checked)). Nothing checks Android itself ([known issue](../known-issues.md#android-is-checked-only-by-emulation)).
- Revisit ESLint only if Oxlint lacks a rule the project needs and typescript-eslint supports TypeScript 7 by then.
