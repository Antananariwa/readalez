# Known issues

Known problems, edge cases and gaps that are accepted for now: what happens, why it was left, and what would fix it. Fixing any of them is optional. Undecided product questions live in SPEC.md's Open questions, decisions in docs/adr/, and bugs that must be fixed in GitHub issues.

## Timing and sentences

Code: `src/core/sentences.ts`. Tests: `src/core/sentences.test.ts`. Added in #7.

### An abbreviation before a capitalised word ends the sentence

- **What happens:** an abbreviation that often ends a sentence ends one whenever the next word starts with a capital letter. So "the U.S. Army" pauses after `U.S.`, and so do Polish `im.` and Russian `им.` before a name ("named after": "im. Mickiewicza", "им. Ленина"). German capitalises every noun, so "usw. Äpfel" pauses too.
- **Why:** the capital-letter test is the simplest form of what sentence splitters do (SPEC.md feature 6). Each abbreviation is listed either as one that never ends a sentence mid-paragraph or as one that may end one.
- **Possible fix:** Punkt-style statistics learned from real text, or a short list of words that commonly follow each abbreviation (`Army`, `Navy`).

### A sentence ending in a single capital letter gets no sentence pause

- **What happens:** a capital letter followed by a dot counts as an initial (`J. R. R.`), so "It was plan A. Then B came." has no pause after `A.` and no sentence start at `Then`. This also affects appendix letters, vitamins and Roman numerals. `I.` is the one exception, as in "It was I."
- **Why:** initials are far more common in books than sentences ending in a single capital. The capital-letter test doesn't help here, since a name follows an initial too.
- **Possible fix:** treat a single capital as an initial only when another initial or a name follows, which needs a list of names or Punkt-style statistics.

### German ordinals get a sentence pause

- **What happens:** `am 3. Oktober` pauses after `3.`, and back and forward see a new sentence at `Oktober`.
- **Why:** the decimals rule covers `3.14` only. A number followed by a dot usually ends an English sentence ("in 1914.").
- **Possible fix:** treat a number with a dot as an ordinal when the next word is a month or starts with a lowercase letter, in German text only. That needs the text's language.

## Schedule

Code: `src/core/schedule.ts`. Added in #7.

### After a stall, one word can show for less than its time

- **What happens:** when the device stalls (for example for 250 ms) and the next word's scheduled end is still ahead, that word shows only until its scheduled end, sometimes for a single frame. The schedule is back on time after that word.
- **Why:** keeping the schedule fixed is what stops drift. Starting a new schedule after every late frame would add up delays.
- **Possible fix:** start a new schedule whenever the next word would get less than half its time. At 1,000 wpm at 30 Hz, normal frames would then trigger it too, and reading would run slightly slow.

### Time left leaves out the pause after play

- **What happens:** the first word after play or a jump shows for at least 3×, but time left counts it at its usual time. Time left is up to 2 ordinary words short each time you press play.
- **Why:** time left stays the same whether you're paused or playing.
- **Possible fix:** add the start factor to time left while paused.

## Build and tests

Added in #26.

### Build-time packages have open npm advisories

- **What happens:** `npm audit` reports 2 low and 8 moderate advisories (on 2026-11-01). They're in `ejs`, `jake`, `filelist`, `minimatch`, `glob` and `deepmerge`, which `vite-plugin-pwa` brings in through `workbox-build`.
- **Why:** they run only during `vite build`, on the project's own config, and none of them ship to users (ADR 0006).
- **Possible fix:** update `vite-plugin-pwa` once `workbox-build` updates them.

### WebKit tests don't see the service worker's own requests

- **What happens:** in WebKit, Playwright doesn't report requests the service worker makes itself, such as the precache fetches. So the WebKit run of "requests only the app's own origin" (`e2e/pwa.spec.ts`) misses them.
- **Why:** it's a Playwright limit. The Chromium run of the same test covers those requests.
- **Possible fix:** none needed while the Chromium run stays. Recheck if Playwright adds service worker requests for WebKit.
