# 20. Generate the service worker with vite-plugin-pwa, and let updates wait until no page is open

Date: 2026-11-01
Status: Accepted

## Context

- The installed app must reload without a network after the first visit ([SPEC.md feature 12, Offline](../../SPEC.md#offline)). So a service worker has to precache every build file, under names that change with each build.
- A new version must never apply while you read ([SPEC.md feature 12](../../SPEC.md#12-install-offline-and-updates)).
- vite-plugin-pwa generates the worker with Workbox, in one of two strategies ([vite-plugin-pwa, Service Worker Strategies And Behaviors](https://vite-pwa-org.netlify.app/guide/service-worker-strategies-and-behaviors)):
  - with `generateSW`, "you don't need to write the code for the service worker";
  - with `injectManifest`, it "will compile your custom service worker and inject its precache manifest".
- Workbox lists "You want to precache files" under "When to use generateSW" ([Workbox, workbox-build](https://developer.chrome.com/docs/workbox/modules/workbox-build)).
- vite-plugin-pwa's `autoUpdate` "will reload any browser windows/tabs with the application opened automatically" ([Automatic reload](https://vite-pwa-org.netlify.app/guide/auto-update)). Its `prompt` lets "the user decide when to update" (same Strategies And Behaviors page).

Options considered:

- **The worker:** written by hand, with a build step of its own for the precache list; vite-plugin-pwa's `injectManifest`; or its `generateSW`.
- **Updates:** `autoUpdate` or `prompt`.

## Decision

- `vite-plugin-pwa` (MIT, a devDependency) writes the service worker and the manifest, in `generateSW` mode. The app's own origin serves the generated `sw.js` and its Workbox runtime (MIT).
- `vite.config.ts` sets `registerType: "prompt"`, and sets `skipWaiting: false` and `clientsClaim: false` explicitly, so a reviewer sees them.
  - A new version installs in the background and waits while a page is open, as seen in #46. So it never applies while you read.
  - The generated worker skips waiting only if a page posts `{ type: "SKIP_WAITING" }`, and the app never posts it.
- The other options lose:
  - A hand-written worker would need a build step of its own for the precache list.
  - `injectManifest` would add a worker to maintain, and the app needs nothing beyond precaching.
  - `autoUpdate` reloads open pages, so an update would apply while you read.

## Consequences

- Two tests hold the update model:
  - `tests/tooling/service-worker.test.ts` fails if code in `src/` mentions `SKIP_WAITING` or `skipWaiting`;
  - `e2e/pwa.spec.ts` checks that `sw.js` never skips waiting or claims pages outside the `SKIP_WAITING` listener.

  So code that posts `SKIP_WAITING` fails the unit test.

- The first launch after a deploy can still show the old version ([known issue](../known-issues.md#a-restart-can-still-show-the-old-version)).
- `vite-plugin-pwa` brings in `workbox-build`, whose build-time packages have open npm advisories ([known issue](../known-issues.md#build-time-packages-have-open-npm-advisories)).
- Revisit the update model with #22, which decides whether the app posts `SKIP_WAITING`.
