# 3. Keep reading logic separate from the UI

Date: 2026-10-27
Status: Accepted

## Context

The reading logic (splitting text, focus position, timing, parsing imported texts) is the heart of the app, and much of it is timing. Claude Code's Stop hook runs the unit tests at the end of every turn that changes files, so they have to finish in seconds, and a browser test suite takes far longer. The owner also wants the project to survive reworks without layers piling up.

## Decision

Reading logic lives in `src/core/` as plain TypeScript with unit tests and no DOM, React or browser APIs. `src/ui/` renders it and holds no reading logic.

## Consequences

- Reading rules are tested exactly and quickly: a sentence and a speed go in, durations come out, with no clocks or rendering.
- The UI can be reworked without breaking the logic.
- The browser is still used where it helps: Playwright tests and screenshots of the UI.
- A later port to another language starts from `src/core` and its tests.
