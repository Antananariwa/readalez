# Architecture

The stable shape of the code. Reasons for the big choices: docs/adr/.

## Bird's eye view

A text is split into words and timed. The UI shows the words one at a time with a focus point.

## Code map

- `src/core/`: the reading logic in plain TypeScript: splitting text, focus position, timing, parsing imported texts.
  `text.ts` turns sections and paragraphs into the words the reader shows (`splitText`), using `words.ts` for word boundaries, `longWords.ts` for splitting words over 13 letters and `focus.ts` for focus letters.
  `timingValues.ts` holds the timing values and the speed range; `sentences.ts` finds sentence ends (abbreviations included) and sentence starts; `durations.ts` gives each word its duration; `schedule.ts` plays the words on a fixed schedule from frame times the caller passes in, with no timers; `timeLeft.ts` sums the remaining durations for the chapter and the book.
  `paste.ts` splits pasted text into paragraphs at blank lines, as one section.
- `src/ui/`: React components and everything that touches the browser. It asks `src/core/` what to show and when.
  `App.tsx` switches between the Add text screen (`AddText.tsx`) and the reader (`Reader.tsx`) in React state, with no router until the library (#12). `WordFrame.tsx` draws the word frame: CSS in `styles.css` centres the focus letter on a fixed point 40% of the way across, and a word too wide for the frame is measured and shrunk. `usePlayback.ts` runs the `requestAnimationFrame` loop and asks `schedule.ts` which word to show. `styles.css` holds the light and dark themes, which follow the system.
  `src/ui/registerServiceWorker.ts` registers the service worker that `vite-plugin-pwa` builds from `vite.config.ts`, which also writes the web app manifest (ADR 0006).
- `public/`: files served as they are, including the app icons. `npm run icons` renders the PNGs from `public/icon.svg` with `scripts/render-icons.ts`.

## Invariants

- `src/core/` never imports from `src/ui/`, React or browser APIs (ADR 0003).
  Enforced by `npm run check`, through `tsconfig.core.json` and `.oxlintrc.json` (ADR 0005).
- `src/ui/` holds no reading logic.
