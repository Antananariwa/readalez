# Architecture

The stable shape of the code. Reasons for the big choices: docs/adr/.

## Bird's eye view

A text is split into words and timed. The UI shows the words one at a time with a focus point, or paces the reader through full paragraphs.

## Code map

- `src/core/`: the reading logic in plain TypeScript: splitting text, focus position, timing, parsing imported texts.
- `src/ui/`: React components and everything that touches the browser. It asks `src/core/` what to show and when.

## Invariants

- `src/core/` never imports from `src/ui/`, React or browser APIs (ADR 0003).
  Enforced by `npm run check`: `tsconfig.core.json` leaves out the DOM library and all ambient types, so browser globals such as `document`, `window` and `localStorage` don't typecheck in `src/core/`; `.oxlintrc.json` bans imports of React and `src/ui/` there (ADR 0005).
- `src/ui/` holds no reading logic.
