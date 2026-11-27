# 2. Build a PWA in TypeScript and React

Date: 2026-10-27
Status: Accepted

## Context

The app has to run on iPhone, on Android and in desktop browsers ([SPEC.md, Devices and browsers](../../SPEC.md#devices-and-browsers)), with no app-store fees. TypeScript and React are the owner's strongest stack. C# or Python would have widened the owner's portfolio, which the app is part of ([SPEC.md, Public](../../SPEC.md#public)).

Options considered:

- **Native iOS.**
  - Xcode's system requirements name only macOS versions ([Xcode system requirements](https://developer.apple.com/xcode/system-requirements/)).
  - Installing on a phone needs the "$99 annual membership" ([Apple Developer Program](https://developer.apple.com/programs/)). Without it, "Provisioning profiles that enable apps to be installed on a device will expire 7 days from issuance" ([Apple, Compare memberships](https://developer.apple.com/support/compare-memberships/)).
  - It covers iPhone alone, so Android and desktop would need other code.
- **C# (Blazor WebAssembly) or Python (Pyodide) in the browser.** The browser downloads the runtime before the app starts:
  - Blazor downloads "the .NET runtime", so its "Download size is larger, and components take longer to load" ([ASP.NET Core Blazor hosting models](https://learn.microsoft.com/en-us/aspnet/core/blazor/hosting-models)).
  - Pyodide's loader "manages downloading the runtime" ([Pyodide, Downloading and deploying](https://pyodide.org/en/stable/usage/downloading-and-deploying.html)).
- **A PWA in TypeScript.** It runs in every target browser, and installs where SPEC.md lists an installed app. On iPhone, Safari installs it through Add to Home Screen ([MDN, Installing PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)).

## Decision

Build a PWA in TypeScript, with React for the UI.

- The other options lose:
  - Native iOS needs a Mac and a yearly fee, or a reinstall every 7 days, and it doesn't reach Android or desktop.
  - With C# or Python, a phone downloads the runtime before the app can start.

## Consequences

- One codebase covers iPhone, Android and desktop browsers.
- Every feature has to work in Safari on iPhone, since the app installs from there.
- Revisit if the app needs features or distribution that only native apps get.
