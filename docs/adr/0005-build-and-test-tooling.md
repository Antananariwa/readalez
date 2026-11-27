# 5. Build and test with Vite, TypeScript 7, Oxlint, Vitest and Playwright

Date: 2026-10-31
Status: Accepted

## Context

- The Stop hook runs `npm run check` at the end of nearly every turn (ADR 0003), so the check has to stay fast as the code grows.
- Core's boundary (ADR 0003) should fail the turn that breaks it, not wait for review.
- The app runs on iPhone, Android and desktop browsers ([SPEC.md, Devices and browsers](../../SPEC.md#devices-and-browsers)). Neither phone's browser runs in the dev container:
  - Playwright doesn't drive Safari itself, "since it relies on patches" ([Playwright, Browsers](https://playwright.dev/docs/browsers#webkit)).
  - There's no Android phone to check on reliably (#84), and the container has no `/dev/kvm` for Android's emulator ([known issue](../known-issues.md#android-is-checked-only-by-emulation)).

## Decision

- **Build, typecheck and lint:** the tools of Vite's `react-ts` template ([create-vite 9.3.3](https://github.com/vitejs/vite/blob/create-vite%409.3.3/packages/create-vite/template-react-ts/package.json)): Vite, TypeScript 7 and Oxlint.
- **Unit tests:** Vitest runs them in plain Node, with no DOM emulation, so they start fast.
- **Core's boundary, enforced in two layers, since each catches what the other can't:**
  - `tsconfig.core.json` has no DOM library and `types: []`, so a global that `src/core/webApis.d.ts` doesn't declare fails the typecheck.
  - `.oxlintrc.json` bans imports of React and of `ui/` in `src/core/**`, which TypeScript alone would resolve without complaint.
- **Browser tests:** Playwright runs `e2e/` against the production build, in four projects:
  - Chromium with the Desktop Chrome preset;
  - WebKit with the iPhone 16 preset, for iPhone Safari;
  - Chromium with the `Galaxy S24` and `Pixel 7` presets, for Android Chrome: a narrow phone and a wide one.
- **CI** runs `npm test`, which runs `npm run check`, and `npm run e2e` on every PR. So a broken UI blocks a merge even when a session skipped the browser tests.

## Consequences

- A file in `src/core/` that imports React or `src/ui/`, or uses an undeclared global, fails `npm run check`.
- Playwright's WebKit "is derived from the latest WebKit main branch sources, often before these updates are incorporated into Apple Safari" ([Playwright, Browsers](https://playwright.dev/docs/browsers#webkit)). So it catches differences in the engine, but it can pass a feature that the phone's older Safari lacks. It misses what only an iPhone shows, such as the installed app, the on-screen keyboard, safe areas and device speed.
- No real Android browser runs in these checks ([known issue](../known-issues.md#android-is-checked-only-by-emulation)).
- The dev container's image holds the browsers, so a Playwright bump needs the owner to rebuild it (`tests/tooling/playwright-version.test.ts`).
- Each Playwright project runs the suite again, so each one adds to the time `npm run e2e` takes.
