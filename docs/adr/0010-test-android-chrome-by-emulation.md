# 10. Test Android Chrome by emulation

Date: 2026-11-09
Status: Accepted

## Context

The owner decided that Android Chrome is a supported v1 platform, in the installed app and in a tab, checked automatically on every PR, with no device checks, since there's no Android phone to check on (#84, SPEC.md Devices and browsers). Real Android Chrome on emulators before v1 is #85.

ADR 0005 runs `npm run e2e` in two Playwright projects: headless Chromium (Desktop Chrome) and WebKit with iPhone 16 emulation (393 px wide). The dev container has no `/dev/kvm` (`ls /dev/kvm`: "No such file or directory", #84), so a real Android emulator isn't an option there (#85).

Playwright's device presets for Android phones run Chromium with a phone's viewport, pixel ratio, touch and user agent. The image and CI already install Chromium's headless shell (ADR 0005, `.github/workflows/node.js.yml:31`); in the image it's Chrome for Testing 156.0.8078.4 (`chrome-headless-shell --version`).

ADR 0009 lets `src/core/` use a web API only if every target browser has it. MDN's compatibility data lists Chrome on Android as "mirror", the same versions as desktop Chrome, for `DecompressionStream`'s `deflate-raw` and for `TextDecoder` (the files linked in `src/core/webApis.d.ts`), and for the Screen Wake Lock API (the file linked in SPEC.md, Devices and browsers).

## Decision

- **Two more projects in `playwright.config.ts`, each running the full suite:**
  - `android-small`: `devices["Galaxy S24"]`, a 360×780 viewport at a device pixel ratio of 3.
  - `android-large`: `devices["Pixel 7"]`, a 412×839 viewport (screen 412×915) at a device pixel ratio of 2.625.

  As printed by `devices[...]` from `@playwright/test` 1.64.1, both presets also set `isMobile` and `hasTouch`, an Android 14 Chrome user agent (`Chrome/156.0.8078.4 Mobile`) and `defaultBrowserType: "chromium"`, so they run in the Chromium already installed.

- **Why these two:** a narrow phone and a wide one. Among Playwright 1.64.1's Android 14 and 16 phone presets, 360 px is the narrowest width (Galaxy S24, Pixel 9, Pixel 10), and 412 px is the width of the Pixel 7, 8 and 8a presets. 360 px is narrower than both the iPhone 16 project and the 375-px iPhone SE that SPEC.md feature 5 sizes the text for.
- **What emulation catches:** layout and text fitting at Android phone widths and pixel ratios, touch input, the mobile viewport, code that reads the user agent, and Chromium's rendering and JavaScript at the version above.
- **What it doesn't catch:** anything of Android itself. That includes the installed app (Chrome's install flow and the app's own window), the system file picker and where a download lands, the wake lock actually keeping the screen on, Chrome freezing or closing a page in the background, storage eviction, the on-screen keyboard and real device speed. Whether Android Chrome differs from desktop Chromium in ways these tests would miss is unknown (not checked). The docs/known-issues.md entry "Android is checked only by emulation" tracks this, and #85 plans real Android Chrome.
- **This supersedes ADR 0005's browser list** ("Browser tests"); the rest of ADR 0005 stands. #52 plans to change the same list for Firefox.

## Consequences

- Every test runs in four projects instead of two. On the dev container, `time npm run e2e` (which also builds) took 1:26.76 with 98 tests passing before this change, and 1:43.51 with 196 passing after it, one run each, with 6 workers (#84's PR).
- CI runs `npm run e2e`, so a test that fails only in an Android project fails CI. No Dockerfile or workflow change was needed.
- Android Chrome has no device checks, so a bug that only real Android shows can reach readers until #85 runs.
