# 3. Keep reading logic separate from the UI

Date: 2026-10-27
Status: Accepted

## Context

The reading logic is the heart of the app: splitting text into words, the focus letter, timing, and parsing imported texts. Much of it is timing. Claude Code's Stop hook runs `npm run check`, unit tests included, at the end of every turn unless the working tree is clean and at `origin/main` (`.claude/hooks/check.sh`). So the unit tests have to finish in seconds, and browser tests take far longer.

Options considered:

- **Where the logic lives:**
  - inside the React components;
  - in plain TypeScript, unit-tested in Node, with the components only rendering it.
- **Which web APIs the logic may use:**
  - none, so core brings its own code for what the platform has, such as inflating DEFLATE;
  - those in WinterTC's [Minimum Common Web API](https://github.com/WinterTC55/proposal-minimum-common-api/blob/008b840d4eb624c5ab466b069a79cbea67d57c90/index.bs), a list of web APIs for runtimes outside browsers, such as Node, that every target browser also has.

## Decision

- Reading logic lives in `src/core/` as plain TypeScript, with unit tests. `src/ui/` renders it with React and holds no reading logic.
- `src/core/` uses no DOM, React or Node APIs. It may use a web API only if both of these hold:
  - The API is in WinterTC's list.
  - Every target browser has it ([SPEC.md, Devices and browsers](../../SPEC.md#devices-and-browsers)).

  So core runs the same in the unit tests in Node and in every target browser. `src/core/webApis.d.ts` declares each such API by hand, with only the parts core uses and a link showing browser support.

- The other options lose:
  - Logic inside the components would break with a UI rework, and every test of it would have to render a component.
  - No web APIs at all would make core carry its own code for what `DecompressionStream` does natively (ADR 0009).

## Consequences

- Unit tests check the reading rules exactly and quickly: a sentence and a speed go in, durations come out, with no clocks or rendering.
- A rework of the UI can't break the logic.
- Playwright tests the UI in the browser instead (ADR 0005).
- A later port to another language starts from `src/core/` and its tests.
- Reading logic can't use a browser-only API, such as `DOMParser` (ADR 0009).
- Revisit the rule for web APIs if core needs one that WinterTC's list lacks.
