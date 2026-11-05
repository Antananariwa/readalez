# Architecture

The stable shape of the code. Reasons for the big choices: docs/adr/.

## Bird's eye view

A text is split into words and timed. The UI shows the words one at a time with a focus point.

## Code map

- `src/core/`: the reading logic in plain TypeScript: splitting text, focus position, timing, parsing imported texts.
  `text.ts` turns sections and paragraphs into the words the reader shows (`splitText`), using `words.ts` for word boundaries, `longWords.ts` for splitting words over 13 letters and `focus.ts` for focus letters.
  `timingValues.ts` holds the timing values and the speed range; `sentences.ts` finds sentence ends (abbreviations included) and sentence starts; `durations.ts` gives each word its duration; `schedule.ts` plays the words on a fixed schedule from frame times the caller passes in, with no timers; `timeLeft.ts` sums the remaining durations for the chapter and the book, and `timeLeftTable` works them out once per speed for lookups at each word.
  `chapterText.ts` gives the paused view each paragraph as written and where each word sits in it (`chapterTexts`), turns a character of a paragraph into a word (`wordAtCharacter`) and counts the words for the Finished card (`wordCount`).
  `paste.ts` reads pasted text (`parsePaste`): it keeps only the part between Gutenberg's markers, splits paragraphs at blank lines, joins hard-wrapped lines (`isHardWrapped`) or else makes each line a paragraph, and takes the title from the first line, as one section.
- `src/ui/`: React components and everything that touches the browser. It asks `src/core/` what to show and when.
  `App.tsx` switches between the Add text screen (`AddText.tsx`) and the reader (`Reader.tsx`) in React state, with no router until the library (#12). `WordFrame.tsx` draws the word frame: CSS in `styles.css` centres the focus letter on a fixed point 40% of the way across, and a word too wide for the frame is measured and shrunk. `Reader.tsx` adds the buttons under the frame (`RepeatButton.tsx` for the speed buttons, which keep stepping while held), the desktop keys, pausing when the page is hidden, the progress bar (`ProgressBar.tsx`) and time left. When paused it shows the chapter's text (`PausedText.tsx`, one text node per paragraph, with a tap turned into a place in the text by the browser's caret-from-point API); after the last word it shows the Finished card (`FinishedCard.tsx`). `usePlayback.ts` runs the `requestAnimationFrame` loop, asks `schedule.ts` which word to show and `sentences.ts` where to jump and where the progress bar lands, and holds the speed and whether reading has finished. `useWakeLock.ts` keeps the screen on while words play. `styles.css` holds the light and dark themes, which follow the system.
  `src/ui/registerServiceWorker.ts` registers the service worker that `vite-plugin-pwa` builds from `vite.config.ts`, which also writes the web app manifest (ADR 0006).
- `public/`: files served as they are, including the app icons. `npm run icons` renders the PNGs from `public/icon.svg` with `scripts/render-icons.ts`.

## Invariants

- `src/core/` never imports from `src/ui/`, React or browser APIs (ADR 0003).
  Enforced by `npm run check`, through `tsconfig.core.json` and `.oxlintrc.json` (ADR 0005).
- `src/ui/` holds no reading logic.
