# 3. Keep reading logic separate from the UI

Date: 2026-10-27
Status: Accepted

## Context

The reading logic is the heart of the app: splitting text into words, the focus letter, timing, and parsing imported texts. Much of it is timing. Claude Code's Stop hook runs `npm run check`, unit tests included, at the end of every turn unless the working tree is clean and at `origin/main` (`.claude/hooks/check.sh`). So the unit tests have to finish in seconds, and browser tests take far longer.

Options considered:

- Reading logic inside the React components, tested in the browser.
- Reading logic in plain TypeScript, unit-tested in Node, with the components only rendering it.

## Decision

- Reading logic lives in `src/core/` as plain TypeScript, with unit tests. `src/ui/` renders it with React and holds no reading logic.
- `src/core/` uses no DOM, React or Node APIs. It may use a web API only if both of these hold:
  - The API is in WinterTC's [Minimum Common Web API](https://github.com/WinterTC55/proposal-minimum-common-api/blob/008b840d4eb624c5ab466b069a79cbea67d57c90/index.bs), a list of web APIs for runtimes outside browsers, such as Node.
  - Every target browser has it ([SPEC.md, Devices and browsers](../../SPEC.md#devices-and-browsers)).

  So core runs the same in the unit tests in Node and in every target browser. Each such API is declared by hand in `src/core/webApis.d.ts`, with only the parts core uses and a link showing browser support.

- Logic inside the components loses: its tests would need a browser, too slow for the Stop hook, and a UI rework would break the logic.

## Consequences

- Reading rules are tested exactly and quickly: a sentence and a speed go in, durations come out, with no clocks or rendering.
- The UI can be reworked without breaking the logic.
- The UI is tested in the browser instead, by Playwright (ADR 0005).
- A later port to another language starts from `src/core/` and its tests.
- A browser-only API, such as `DOMParser`, can't be used for reading logic (ADR 0009).
