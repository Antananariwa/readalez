# 6. Host on Cloudflare Pages, with a vite-plugin-pwa service worker

Date: 2026-11-01
Status: Accepted

## Context

The owner checks every PR on an iPhone and on desktop before merging, and SPEC.md requires every feature to work in the installed Home Screen app. So the app needs a host and a minimal installable shell (issue #5). The host must:

- serve static files over HTTPS, free for a public repo;
- deploy `main` to production and give each PR a preview URL, posted on the PR;
- give each preview its own origin, so its service worker and storage never touch production's or another preview's. A preview that changes how data is stored must not touch the owner's real library;
- deploy without a workflow file, because the agent's token can't push one;
- add no analytics, cookies or scripts. SPEC.md feature 13 promises requests only to the app's own origin.

The installed app must reload without a network after the first visit. A new version must wait for the next launch, because SPEC.md feature 12 says updates never apply while you read.

## Hosts compared

Free plans as documented on 2026-11-01.

| Host             | Preview on its own origin per PR                                                                                                        | No workflow file                                                         | Settings to switch off                                                                                                                               | Free-plan limits                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Pages | Yes: `<hash>.readalez.pages.dev` per deployment and `<branch>.readalez.pages.dev` per branch. `pages.dev` is on the Public Suffix List. | Yes, through Cloudflare's GitHub app, which also posts the preview URLs. | None. Web Analytics is opt-in.                                                                                                                       | Unlimited static requests and bandwidth. 500 builds a month, one at a time.                                         |
| Vercel Hobby     | Yes, on `*.vercel.app`.                                                                                                                 | Yes, through Vercel's GitHub app.                                        | Vercel Authentication on previews (on by default; the iPhone and the installed app can't get past it) and the Vercel Toolbar (adds Vercel's script). | Non-commercial personal use only. About 100 GB of transfer a month; the project pauses if exceeded.                 |
| Netlify          | Yes: `deploy-preview-<n>--<site>.netlify.app`.                                                                                          | Yes.                                                                     | The collaboration drawer on previews.                                                                                                                | Credit-based: each production deploy costs 15 of 300 monthly credits, about 20 merges, after which the site pauses. |
| GitHub Pages     | No. Previews would live in paths under the same `<owner>.github.io` origin as production.                                               | No, it needs a workflow file.                                            | None.                                                                                                                                                | Fails the origin requirement.                                                                                       |

## Decision

- **Host: Cloudflare Pages**, connected through Cloudflare's GitHub app. The owner chose it over Vercel Hobby, which the owner had asked about first.
  - It meets every requirement without switching anything off.
  - Its bandwidth is unlimited, and its terms don't restrict use to non-commercial projects.
  - Each PR's branch gets a preview URL that stays the same across pushes, so an app installed from a preview keeps working while the PR changes.
  - Build: `npm run build`, output `dist`, `NODE_VERSION=24`. Production is `https://readalez.pages.dev`. The setup steps are in the PR for issue #5.
  - No host config file in the repo. Pages serves `index.html` for unknown paths when there's no `404.html`. Add `public/_headers` only if a preview shows that a file, such as `sw.js`, is cached too long.
- **Service worker and manifest: `vite-plugin-pwa`** (a devDependency), in `generateSW` mode.
  - It's the standard tool for PWAs built with Vite. It writes the precache list of hashed build files, which a hand-written worker would need its own build step for, and it writes the manifest.
  - The generated `sw.js` and its Workbox runtime chunk (MIT, a few KB) are served from the app's own origin. Nothing loads from another origin.
- **Update model:** `registerType: "prompt"`, with `skipWaiting: false` and `clientsClaim: false` set explicitly, so a reviewer sees them. A new version installs in the background and takes over only once every open page is closed.
  - In this mode, Workbox's generated worker includes a `message` listener that skips waiting only if a page posts `{ type: "SKIP_WAITING" }`. The app never posts it. Issue #22 decides whether to use it, and must still never apply an update while you read.
- **Registration:** `injectRegister: false`. `src/ui/registerServiceWorker.ts` calls `navigator.serviceWorker.register("/sw.js")` in production builds only, so `workbox-window` isn't bundled.
- **Manifest:** name and short name "Readalez", `display: "standalone"`, `start_url` and `scope` `/`, theme and background colours, and 192 and 512 px PNG icons. The 512 px icon is also listed as maskable, because its letter sits inside the maskable safe zone. `index.html` links a 180 px `apple-touch-icon` for iPhone.
- **Placeholder icon:** `public/icon.svg`, a white "R" on a plain dark square, until SPEC.md's icon question is decided. `npm run icons` renders the PNGs from it with Playwright's Chromium (`scripts/render-icons.ts`), so no image library is added.

## Consequences

- The owner creates the Cloudflare account and connects the repo. The dev container's firewall blocks Cloudflare, so the agent can't check a deployment itself. Device checks on the preview are the owner's.
- **Main risk:** Cloudflare puts new features into Workers rather than Pages. Pages is still supported, and a static site needs none of the Workers-only features. If Pages is retired, Cloudflare documents a migration to Workers static assets.
- `e2e/pwa.spec.ts` checks the manifest and icons, the offline reload, that every request stays on the app's origin, and that `sw.js` never skips waiting or claims pages outside that `SKIP_WAITING` listener. `tests/tooling/service-worker.test.ts` fails `npm run check` if code in `src/` mentions `SKIP_WAITING` or `skipWaiting`. Code that sends that message (#22) must update both tests on purpose.
- `vite-plugin-pwa` pulls in `workbox-build`, which brings build-time packages with open npm advisories (in `ejs`, `jake`, `minimatch`, `glob` and `deepmerge`: 2 low and 8 moderate on 2026-11-01). They run only at build time, on the project's own config. None of them ship to users. Revisit when `workbox-build` updates them.
- A new icon: edit `public/icon.svg`, run `npm run icons` and commit the PNGs.
