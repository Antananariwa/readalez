# 2. Build a PWA in TypeScript and React

Date: 2026-10-27
Status: Accepted

## Context

The app has to run on the owner's iPhone and in desktop browsers, with Android as a later option, without paying for app stores. TypeScript and React are the owner's strongest stack; C# or Python would have added variety to the owner's portfolio.

Options considered:

- Native iOS: needs a Mac and the $99/year developer program, and free builds stop working after 7 days.
- C# (Blazor WebAssembly) or Python in the browser: the app has to download its runtime first, so it starts slower on a phone.
- A PWA in TypeScript: runs natively in every browser and installs on iPhone through Safari's Add to Home Screen, for free.

## Decision

Build a PWA in TypeScript, with React for the UI.

## Consequences

- One codebase covers iPhone, desktop browsers and, later, Android through Capacitor.
- Every feature has to work in Safari, since that's how the app installs on an iPhone.
- A C# or Python version stays possible as a later port, starting from `src/core` and its tests (ADR 0003).
- Revisit if the app ever needs features or distribution that only native apps get.
