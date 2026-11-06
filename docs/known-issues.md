# Known issues

Problems seen in the app or its tooling and accepted for now, grouped by area. A fix removes its entry. Each section names its code, tests and the issue that added it, when there are any. Each entry has a title saying what happens, then **What happens**, **Why it's left** and, when there are any, **Suggestions** (a possible cause or fix).

## Timing and sentences

Code: `src/core/sentences.ts`. Tests: `src/core/sentences.test.ts`. Added in #7.

### An abbreviation before a capitalised word ends the sentence

- **What happens:** an abbreviation that often ends a sentence ends one whenever the next word starts with a capital letter. So "the U.S. Army" pauses after `U.S.`, and so do Polish `im.` and Russian `им.` before a name ("named after": "im. Mickiewicza", "им. Ленина"). German capitalises every noun, so "usw. Äpfel" pauses too.
- **Why it's left:** the capital-letter test is the simplest form of what sentence splitters do (SPEC.md feature 6). Each abbreviation is listed either as one that never ends a sentence mid-paragraph or as one that may end one.
- **Suggestions:** Punkt-style statistics learned from real text, or a short list of words that commonly follow each abbreviation (`Army`, `Navy`).

### A sentence ending in a single capital letter gets no sentence pause

- **What happens:** a capital letter followed by a dot counts as an initial (`J. R. R.`), so "It was plan A. Then B came." has no pause after `A.` and no sentence start at `Then`. This also affects appendix letters, vitamins and Roman numerals. `I.` is the one exception, as in "It was I."
- **Why it's left:** initials are far more common in books than sentences ending in a single capital (not checked). The capital-letter test doesn't help here, since a name follows an initial too.
- **Suggestions:** treat a single capital as an initial only when another initial or a name follows, which needs a list of names or Punkt-style statistics.

### German ordinals get a sentence pause

- **What happens:** `am 3. Oktober` pauses after `3.`, and back and forward see a new sentence at `Oktober`.
- **Why it's left:** the decimals rule covers `3.14` only. A number followed by a dot usually ends an English sentence, as in "in 1914." (not checked).
- **Suggestions:** treat a number with a dot as an ordinal when the next word is a month or starts with a lowercase letter, in German text only. That needs the text's language.

## Schedule

Code: `src/core/schedule.ts`. Added in #7.

### After a stall, one word can show for less than its time

- **What happens:** when the device stalls (for example for 250 ms) and the next word's scheduled end is still ahead, that word shows only until its scheduled end, sometimes for a single frame. The schedule is back on time after that word.
- **Why it's left:** keeping the schedule fixed is what stops drift (`src/core/schedule.test.ts`, "doesn't drift"). Starting a new schedule after every late frame would add up delays (not checked).
- **Suggestions:** start a new schedule whenever the next word would get less than half its time. At 1,000 wpm at 30 Hz, normal frames would then trigger it too, and reading would run slightly slow.

### Time left leaves out the pause after play

- **What happens:** the first word after play or a jump shows for at least 1.5×, but time left counts it at its usual time. Time left is up to half an ordinary word short each time you press play.
- **Why it's left:** time left stays the same whether you're paused or playing.
- **Suggestions:** add the start factor to time left while paused.

## Pasted text

Code: `src/core/paste.ts`. Tests: `src/core/paste.test.ts`. Added in #9.

### Two short lines of similar length join into one paragraph

- **What happens:** `"Hello there\nHow are you?"` comes out as one paragraph, read as "Hello there How are you?". The first line breaks mid-sentence and is the only wrapped line, so it counts as hard-wrapped (`isHardWrapped`). Found by the reviewer in #9.
- **Why it's left:** it follows SPEC.md feature 1's rule as written (most lines break mid-sentence at similar lengths), and with so few lines a hard-wrapped text looks the same. Longer texts, and a heading above a paragraph line, split as expected (`src/core/paste.test.ts`).
- **Suggestions:** treat text as hard-wrapped only with at least a few wrapped lines, if short pastes turn out to matter.

### A pasted Gutenberg book's title can be a fragment

- **What happens:** the owner pasted the whole plain text of a Gutenberg book (_The Works of William Shakespeare_, Cambridge Edition, Vol. 8) on the iPhone, testing #57. The suggested title was `THE WORKS`, the first line after the `*** START OF` line, because the title page spreads the title over lines with blank lines between them. The field can be edited before saving.
- **Why it's left:** the first line is SPEC.md feature 1's rule, and the apps checked don't guess more. [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/app-page.ts#L192-L193) titles pasted text "Pasted Text" unless one is typed. [Calibre](https://github.com/kovidgoyal/calibre/blob/ad42fa09dbc3993846cea83215e81acfd7683765/src/calibre/ebooks/metadata/txt.py#L22-L40) uses a TXT file's name, or its first line when three blank lines and an author line follow it. Neither reads Gutenberg's header.
- **Suggestions:** take the header's `Title:` line when the paste includes Gutenberg's header (not checked: whether every Gutenberg file has that line).

## Reader

Code: `src/ui/App.tsx`, `src/ui/Reader.tsx`, `src/ui/ProgressBar.tsx`. Added in #8, #10 and #11.

### The browser's Back leaves the app

- **What happens:** the Add text screen and the reader are React state, not history entries. So the browser's Back button, or a swipe back, leaves Readalez instead of returning from the reader to Add text. The reader's own Back button works.
- **Why it's left:** two screens with one way between them don't need a router, and the library (#12) reshapes the navigation.
- **Suggestions:** push a history entry when the reader opens and close it on `popstate`, or a router once there are more screens.

### Reading goes on for a while after swiping to the app switcher

- **What happens:** in the installed app on the owner's iPhone, swiping up from the bottom while words played left reading running with the app off screen. It stopped late, hard to tell exactly when. Pausing first, then switching apps, left it paused on return. Seen once, testing #59.
- **Why it's left:** reading does pause and never resumes on its own, as SPEC.md feature 7 asks. The owner chose to note it for later; it may also interact with notifications.
- **Suggestions:** Possible cause: the page counts as visible while the app shows as a card in the switcher, and `visibilitychange` (`src/ui/Reader.tsx`) fires only once the app is fully in the background (not checked). Also pausing on the window's `blur` or `pagehide` event might stop it sooner (not checked), to be tried on the iPhone.

### A stray tap or drag loses your place

- **What happens:** tapping a word in the paused view or moving the progress bar moves the frame there at once, and nothing leads back to where you were reading. The owner found it very annoying when it happened by accident, reviewing #68.
- **Why it's left:** the owner chose to record it for later (#68).
- **Suggestions:** after a tap or a drag, show a "Back to where you were" button for a while that returns to the word before the move. The open-source reader [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader#readme) has a "Back to my position" link for scrolling away while paused, and makes a tapped word play only on a second tap. Kindle's "Go back to page …" after jumping to another place is a similar idea (not checked).

### A tap on the marked word's left edge after a dash can pick the word before

- **What happens:** from reading the code, not checked in a browser: in the paused view, a tap on the left edge of the marked word's first letter, when a dash joins it to the word before ("yes—no" with "no" marked), can move the frame to the word before. The caret then sits at the end of the text before the `<mark>`, and `characterAt` (`src/ui/PausedText.tsx`) takes the character before the caret. Found while fixing the reviewer's finding in #68.
- **Why it's left:** it needs a tap on a sliver of one letter, and only where a dash joins two words. The owner chose to leave it for later (#68).
- **Suggestions:** when the caret is at the end of a text node, measure the first character of the next text node instead.

### The progress bar moves hundreds of words per pixel in a novel

- **What happens:** the bar has one step per word. The 1 MB text of "with a novel's worth of text" (`e2e/navigation.spec.ts`) has 192,560 words. At a 375-px viewport the bar is 343 px wide (the page's padding in `src/ui/styles.css`), about 560 words per pixel, so a drag can't land on a chosen sentence.
- **Why it's left:** letting go moves to the nearest sentence start (SPEC.md feature 7), and the sentence buttons and the paused view then reach the exact place.
- **Suggestions:** show the word or the percentage under the finger while dragging, or make the bar cover the chapter once EPUBs bring chapters (#15).

## Build and tests

Added in #26.

### Build-time packages have open npm advisories

- **What happens:** `npm audit` reports 2 low and 8 moderate advisories (on 2026-11-01). They're in `ejs`, `jake`, `filelist`, `minimatch`, `glob` and `deepmerge`, which `vite-plugin-pwa` brings in through `workbox-build`.
- **Why it's left:** they run only during `vite build`, on the project's own config, and none of them ship to users (ADR 0006).
- **Suggestions:** update `vite-plugin-pwa` once `workbox-build` updates them.

### WebKit tests don't see the service worker's own requests

- **What happens:** in WebKit, Playwright doesn't report requests the service worker makes itself, such as the precache fetches. So the WebKit run of "requests only the app's own origin" (`e2e/pwa.spec.ts`) misses them.
- **Why it's left:** the Chromium run of the same test covers those requests.
- **Suggestions:** Possible cause: a Playwright limit. No fix needed while the Chromium run stays. Recheck if Playwright adds service worker requests for WebKit.

### Firefox isn't in the automatic tests

- **What happens:** SPEC.md supports desktop Firefox, but `npm run e2e` and CI run only Chromium and WebKit. Firefox is checked only by hand, in each PR's Device checks.
- **Why it's left:** the owner expected adding it to take too much time (#51). #52 plans adding it.
- **Suggestions:** add `firefox` to `npx playwright install --with-deps --only-shell chromium webkit` in `.devcontainer/Dockerfile` and `.github/workflows/node.js.yml`, rebuild the container, then add a `{ name: "firefox", use: { ...devices["Desktop Firefox"] } }` project to `playwright.config.ts` and update its comment.

## Install and updates

Code: `vite.config.ts`, `src/ui/registerServiceWorker.ts`. Added in #40.

### A restart can still show the old version

- **What happens:** after a deploy, the owner's Chrome still showed the old version after a restart, until Ctrl+Shift+R loaded the new one (#40). In a test in headless Chromium and WebKit, with a relaunched Playwright profile standing in for a restart, the first launch after a deploy showed the old version and downloaded the new one, which waited; the launch after that showed the new one (#46).
- **Why it's left:** with `skipWaiting: false`, a new service worker waits while a page is open (#46), so an update never interrupts reading (SPEC.md feature 12).
- **Suggestions:** show an "Update ready" notice with a Reload button once the new version has downloaded, hidden while a book plays. The built service worker already accepts a `SKIP_WAITING` message, so `src/ui/registerServiceWorker.ts` could watch `registration.waiting`, post that message on Reload, then reload on `controllerchange`.
