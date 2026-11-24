# Known issues

Problems seen in the app or its tooling and accepted for now. A fix removes its entry. The file takes the form of [arc42's section 11, Risks and technical debt](https://docs.arc42.org/section-11/): "a list of identified technical risks or technical debts", with "suggested measures to minimize, mitigate or avoid risks or reduce technical debts". Sections follow SPEC.md's v1 features in order, then the tooling, and each names its code and tests. An entry has a title saying what happens, then:

- **What happens:** the symptoms; the cause, or "Possible cause: …"; and where and how often it was seen, with its issue or PR.
- **Why it's left:** the reasoning.
- **Measures:** fixes, mitigations or workarounds, when there are any.

## Pasted text

Code: `src/core/paste.ts`. Tests: `src/core/paste.test.ts`.

### Two short lines of similar length join into one paragraph

- **What happens:** `"Hello there\nHow are you?"` reads as one paragraph, "Hello there How are you?". Its one wrapped line breaks mid-sentence, so SPEC.md feature 1's rule (Paragraphs) counts the text as hard-wrapped (`isHardWrapped`). Seen in #57's review.
- **Why it's left:** with so few lines, the text looks the same as a hard-wrapped one. Longer texts, and a heading above one paragraph line, split as expected (`src/core/paste.test.ts`).
- **Measures:** count text as hard-wrapped only with at least a few wrapped lines, if short pastes turn out to matter.

### A pasted Gutenberg book's title can be a fragment

- **What happens:** pasting the whole plain text of Gutenberg's _The Works of William Shakespeare_, Cambridge Edition, Vol. 8, gave the title `THE WORKS`, the first line after the `*** START OF` line (SPEC.md feature 1, Title and author). Its title page spreads the title over lines with blank lines between them. Seen on an iPhone, testing #57.
- **Why it's left:** the apps checked don't guess more. [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/app-page.ts#L192-L193) titles pasted text "Pasted Text" unless one is typed. [Calibre](https://github.com/kovidgoyal/calibre/blob/ad42fa09dbc3993846cea83215e81acfd7683765/src/calibre/ebooks/metadata/txt.py#L22-L40) uses a TXT file's name, or its first line when three blank lines and an author line follow it. Neither reads Gutenberg's header.
- **Measures:** the title can be edited before saving and later in the library (SPEC.md feature 1). A fix: take the header's `Title:` line when the paste includes Gutenberg's header (not checked: whether every Gutenberg file has that line).

## EPUB import

Code: `src/core/epub.ts`, `src/core/epub/` and `src/ui/importEpub.ts`. Tests: `src/core/epub.test.ts`, `src/core/epub/*.test.ts`, `tests/epub/fixtures.test.ts` and `e2e/importEpub.spec.ts`.

### Named entities other than XML's five show as written

- **What happens:** a named entity other than XML's five, such as `&nbsp;` or `&mdash;`, stays in the text as written, and the reader shows it as a word or part of one (`src/core/epub/xml.test.ts`). They need the document's DTD, which `src/core/epub/xml.ts` never loads (ADR 0009). Not seen in the 31 EPUBs in the repo, which use no named entity but `&amp;`, `&lt;` and `&gt;` (#111).
- **Why it's left:** EPUB 3.3 lets an XHTML document name no external DTD ([section 3.9](https://www.w3.org/TR/epub-33/#sec-xml-constraints), [appendix B](https://www.w3.org/TR/epub-33/#app-identifiers-allowed)). So only EPUB 2 books can use XHTML 1.1's entities, by naming its DTD, as the _Pride and Prejudice_ EPUB 2 fixture does.
- **Measures:** a table of XHTML 1.1's named entities, if a real book turns up with them.

### Unusual namespace prefixes lose verse and the nav

- **What happens:** `xml.ts` doesn't resolve namespaces (ADR 0009), so verse and the nav's `toc` are found by an attribute written `epub:type` (`src/core/epub/content.ts`, `src/core/epub/toc.ts`). A book that binds the EPUB namespace to another prefix has its verse read as prose, and its chapter list comes from its NCX, or from its headings if it has none. Not seen: all 31 EPUBs in the repo use `epub:` (#111).
- **Why it's left:** resolving namespaces would add code for a case not seen.
- **Measures:** resolve `xmlns:` declarations in `xml.ts` and match attributes by namespace.

### Preformatted text loses its line breaks

- **What happens:** `src/core/epub/content.ts` collapses all whitespace, inside `pre` too, so a `pre`'s lines join into one paragraph of prose, with no pause at each line's end. Seen in 2 of the 31 EPUBs in the repo (#111): Gutenberg's _Moby Dick_ sets verse in 17 `pre` elements, and Gutenberg's _Alice_ sets its mouse's tale in one ("Fury said to a mouse, That he met in the house").
- **Why it's left:** `pre` is rare in the books checked. None of the 24 built-in books uses it.
- **Measures:** read each line of a `pre` as a line break.

### A long book keeps the page busy while it's imported and opened

- **What happens:** importing an EPUB, also on a built-in book's first open (SPEC.md feature 3), runs on the page's main thread. The page gets a turn only between steps of splitting the text into words (`readEpub` in `src/ui/importEpub.ts`, #97). Opening a book splits its whole text again in one go, with no progress shown (`read` in `src/ui/App.tsx`). In Node in the dev container, splitting _Moby Dick_'s fixture (217,867 words) into words took 1.7 s, and parsing, timing and naming it 0.2 s (#97). How long either takes on an iPhone is unknown.
- **Why it's left:** for an import, a progress bar is less code than importing in the background, and nothing else on the page is needed meanwhile (SPEC.md feature 2, Import progress). Whether opening is too slow waits on v1's speed targets (#73).
- **Measures:** split in a Web Worker, or make `splitText` faster, since it takes most of the time.

## Reading flow and notes

Code: `src/core/epub/flow.ts`, `src/core/epub/content.ts`, `src/core/readingFlow.ts`. Tests: `src/core/epub/flow.test.ts`, `src/core/readingFlow.test.ts`, `tests/epub/fixtures.test.ts`, `e2e/readingFlow.spec.ts`.

### Books imported before #15 read whole

- **What happens:** a book imported before #15 has no stored reading flow (ADR 0011). So it opens, reads and counts progress from its first word to its last, Gutenberg's header and license included, and its chapter list marks nothing as skipped.
- **Why it's left:** the flow needs the book's markup, which isn't stored (ADR 0011). Only books imported between #14 and #15 are affected.
- **Measures:** delete the book and import it again. Its position is lost.

### Paperwork without markup or a known title stays in the flow

- **What happens:** the reading flow's rules know publishing paperwork by its markup or a few section titles (SPEC.md feature 2, Reading flow). Two fixtures end their flow with paperwork that has neither. _Pride and Prejudice_ ends with its printer's imprint, "CHISWICK PRESS:—CHARLES WHITTINGHAM AND CO. …" (`tests/epub/fixtures.test.ts`, "reading flow"). _Romeo and Juliet_ ends with a "Transcriber's Notes" box in bold, not a heading, seen with a script (#89). No test covers it.
- **Why it's left:** both are a line or two before Gutenberg's footer, and rules for them would be guesses from one book each.
- **Measures:** read a paragraph that is only "Transcriber's Notes" as a section title, and know printers' imprints by a short list of words, if more books show them.

### A note written as plain text stays in the flow

- **What happens:** notes and their markers leave the flow only when markup or a link marks them (SPEC.md feature 2, Notes). _A Connecticut Yankee in King Arthur's Court_ writes its three notes as plain text, each marked `*` on the word before it: one inside its paragraph ("No force,\* [\*Footnote from M.T.: No matter.] said Merlin") and two as their own paragraphs. All three are read in the flow (`tests/epub/fixtures.test.ts`).
- **Why it's left:** it's the book's own text, with nothing to tell a note from the sentence around it, and it's seen in one book. A `*` or a superscript number without a link can also be part of the text.
- **Measures:** read a bracketed passage starting with `[*` as a note and move it to the notes section, if more books show this form. The same book also has a bracketed gloss with no marker, "as he were wood [\*demented], for fear", which that rule would take too.

## Library

Code: `src/ui/Library.tsx`, `src/ui/storage.ts`, `src/ui/useSavePosition.ts`, `src/core/position.ts`. Tests: `e2e/library.spec.ts`, `e2e/positions.spec.ts`, `src/core/position.test.ts`.

### A rename made just before a reload can be lost

- **What happens:** the rename dialog closes before the new title is written to IndexedDB (`src/ui/Library.tsx`, `src/ui/App.tsx`). In `e2e/library.spec.ts`, a reload right after the dialog closed showed the old title in 3 of 3 Chromium runs; waiting for the list to show the new title first kept it (#72). Deleting works the same way.
- **Why it's left:** the list shows the new title only once it's stored, so what's on screen is what's saved. How long the write takes is unknown, and closing the app in that moment seems unlikely (not checked).
- **Measures:** keep the dialog open, with its buttons disabled, until the write has committed.

### Time left in the library is at 300 wpm, whatever speed you read at

- **What happens:** the library shows each book's time left at the default speed, 300 wpm (`DEFAULT_WPM` in `src/ui/Library.tsx`), where SPEC.md feature 6 asks for the current speed. The reader's speed starts at 300 wpm each time a book opens and isn't stored (`src/ui/usePlayback.ts`).
- **Why it's left:** no speed is stored until #18 stores it with the settings (SPEC.md feature 8).
- **Measures:** once #18 stores the speed, pass it to the library.

### Books added before #13 show no progress until opened

- **What happens:** a book stored before #13 has no saved reading (ADR 0008), so its library row shows no progress or time left until it's opened (`src/ui/Library.tsx`, `e2e/library.spec.ts`). Opening saves the position at once (`src/ui/useSavePosition.ts`).
- **Why it's left:** working the figures out means splitting the book's text, which the library avoids (ADR 0008). Only books added between #12 and #13 are affected.
- **Measures:** work them out once for such books in the background after the library shows.

### Progress in the library can be out of date after an update

- **What happens:** after an update that changes how words are split or timed, the library shows each book's progress and time left from its last save until the book is opened again (ADR 0008).
- **Why it's left:** working them out on each visit to the library means splitting every text again, and splitting 1 MB took 1.3 s in Node (ADR 0007).
- **Measures:** store the version of the splitting rules with the figures, and work out the stale ones in the background after an update.

### A failed save of the position shows nothing

- **What happens:** if IndexedDB refuses a write, the position isn't saved, and the reader shows no message (`src/ui/useSavePosition.ts`). The error reaches only the browser console, and the next save tries again. Possible cause: a full device (not checked). Not seen; known from the code.
- **Why it's left:** what a reader should do about a failed save is unknown.
- **Measures:** show a message once in the library if saves keep failing.

## Timing

Code: `src/core/sentences.ts`, `src/core/schedule.ts`, `src/core/timeLeft.ts`. Tests: `src/core/sentences.test.ts`, `src/core/schedule.test.ts`, `src/core/timeLeft.test.ts`.

### An abbreviation before a capitalised word ends the sentence

- **What happens:** an abbreviation that often ends a sentence ends one whenever the next word starts with a capital letter (SPEC.md feature 6, Abbreviations). So "the U.S. Army" pauses after `U.S.`, and so do Polish `im.` and Russian `им.` before a name ("named after": "im. Mickiewicza", "им. Ленина"). German capitalises every noun, so "usw. Äpfel" pauses too.
- **Why it's left:** the capital-letter test is the simplest form of what sentence splitters do (SPEC.md feature 6, Abbreviations).
- **Measures:** Punkt-style statistics learned from real text, or a short list of words that commonly follow each abbreviation (`Army`, `Navy`).

### A sentence ending in a single capital letter gets no sentence pause

- **What happens:** a capital letter followed by a dot counts as an initial (`J. R. R.`), so "It was plan A. Then B came." has no pause after `A.` and no sentence start at `Then` (`abbreviation` in `src/core/sentences.ts`). `I.` is the one exception, as in "It was I." This also affects appendix letters, vitamins and Roman numerals. In the 31 English EPUBs in the repo, 11 of the 231 single capitals with a dot before a capitalised word end a sentence this way, as in "Look out for D. He has" (counted by reading each, #111).
- **Why it's left:** initials are far more common: the other 220 are initials, Roman numerals and the like. The capital-letter test doesn't help here, since a name follows an initial too.
- **Measures:** read a single capital as an initial only when another initial or a name follows, which needs a list of names or Punkt-style statistics.

### German ordinals get a sentence pause

- **What happens:** `am 3. Oktober` pauses after `3.`, and previous sentence and next sentence treat `Oktober` as a sentence start.
- **Why it's left:** in English, a number with a dot is rarely an ordinal. In the 31 English EPUBs in the repo, none of the 395 numbers with a dot comes before a lowercase English word; most are chapter numbers ("CHAPTER 45. The Affidavit.") or end a sentence ("died in 1814. He was") (#111).
- **Measures:** read a number with a dot as an ordinal when the next word is a month or starts with a lowercase letter, in German text only. That needs the text's language.

### After a stall, one word can show for less than its time

- **What happens:** when the device stalls (for example for 250 ms) and the next word's scheduled end is still ahead, that word shows only until its scheduled end, sometimes for a single frame. The schedule is back on time after that word (`tick` in `src/core/schedule.ts`, `src/core/schedule.test.ts`).
- **Why it's left:** a fixed schedule, with each word ending a set time after the one before was due, is what stops drift (SPEC.md feature 6, No drift, no skipped words).
- **Measures:** start a new schedule whenever the next word would get less than half its time. At 1,000 wpm with 30 Hz frames, ordinary frames would then trigger it too, and reading would run slightly slow.

### Time left leaves out the pause after play

- **What happens:** the first word after play or a jump shows for at least 1.5× (SPEC.md feature 6, Starting values), but time left counts it at its usual time (`timeLeft` in `src/core/timeLeft.ts`). So time left is up to half an ordinary word short each time you press play.
- **Why it's left:** time left stays the same whether you're paused or playing.
- **Measures:** add the start factor to time left while paused.

## Reader

Code: `src/ui/App.tsx`, `src/ui/Reader.tsx`, `src/ui/PausedText.tsx`, `src/ui/ProgressBar.tsx`. Tests: `e2e/reader.spec.ts`, `e2e/navigation.spec.ts`.

### The browser's back button leaves the app

- **What happens:** the library, the Add text screen and the reader are screens in React state, not history entries (`src/ui/App.tsx`). So the browser's back button, or a swipe back, leaves Readalez instead of returning to the library. The app's own ways back work.
- **Why it's left:** No reason recorded.
- **Measures:** push a history entry when the Add text screen or the reader opens, and close it on `popstate`. Or a router, once there are more screens: SPEC.md features 8, 11 and 13 add some.

### Reading goes on for a while after swiping to the app switcher

- **What happens:** in the installed app on an iPhone, swiping up from the bottom while words played left reading running with the app off screen. It stopped late, hard to tell exactly when. Pausing first, then switching apps, left it paused on return. Seen once, testing #59. Possible cause: the page counts as visible while the app shows as a card in the switcher, and `visibilitychange` (`src/ui/Reader.tsx`) fires only once the app is fully in the background (not checked).
- **Why it's left:** reading does pause in the end, and never resumes on its own, as SPEC.md feature 7 asks (Pausing by itself).
- **Measures:** also pause on the window's `blur` or `pagehide` event, tried on the iPhone. Whether either stops reading sooner is not checked.

### A stray tap or drag loses your place

- **What happens:** tapping a word in the paused view, or letting go of the progress bar, moves the position there at once and saves it (SPEC.md features 4 and 7). Nothing leads back to where reading was. It happened by accident while reviewing #68.
- **Why it's left:** No reason recorded.
- **Measures:** after a tap or a drag, offer a way back to the word before the move for a while. [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader#readme) has a "Back to my position" link after scrolling away while paused.

### A tap on the marked word's left edge after a dash can pick the word before

- **What happens:** in the paused view, a tap on the left edge of the marked word's first letter, where a dash joins it to the word before ("yes—no" with "no" marked), can move to the word before. The caret then sits at the end of the text node before the `<mark>`, and `characterAt` (`src/ui/PausedText.tsx`) takes the character before the caret. Found by reading the code in #68; not seen in a browser.
- **Why it's left:** it needs a tap on a sliver of one letter, and only where a dash joins two words.
- **Measures:** when the caret is at the end of a text node, measure the first character of the next text node instead.

### The progress bar moves hundreds of words per pixel in a novel

- **What happens:** the bar has one step per word of the reading flow (`src/ui/Reader.tsx`). The 1 MB text of "with a novel's worth of text" (`e2e/navigation.spec.ts`) has 192,560 words. At a 375-px viewport the bar is 343 px wide, inside the page's padding (`src/ui/styles.css`), so each pixel holds about 560 words. A drag can't land on a chosen sentence.
- **Why it's left:** letting go moves to the nearest sentence start (SPEC.md feature 7, Progress bar). Previous sentence, next sentence and the paused view then reach the exact place.
- **Measures:** show the word or the percentage under the finger while dragging, or make the bar cover the chapter (SPEC.md feature 7, What a chapter is).

## Install and updates

Code: `vite.config.ts`, `src/ui/registerServiceWorker.ts`. Tests: `e2e/pwa.spec.ts`, `tests/tooling/service-worker.test.ts`.

### A restart can still show the old version

- **What happens:** the first launch after a deploy shows the old version and downloads the new one, which waits; the launch after that shows the new one. Seen in desktop Chrome after a restart, until Ctrl+Shift+R loaded the new version (#40), and in headless Chromium and WebKit, with a relaunched Playwright profile standing in for a restart (#46).
- **Why it's left:** with `skipWaiting: false`, a new service worker waits while a page is open (ADR 0006), so an update never interrupts reading (SPEC.md feature 12, Updates).
- **Measures:** a notice once the new version has downloaded, hidden while a book plays, that reloads into it with the `SKIP_WAITING` message the built service worker already takes (ADR 0006). #22 decides.

## Where to find books

Code: `src/ui/AddText.tsx`, where books are added.

### Readalez doesn't check whether a book is free to read where you live

- **What happens:** Readalez adds any pasted text or imported EPUB, and checks nothing about its copyright.
- **Why it's left:** books readers add stay on their device, so the app distributes nothing (SPEC.md, Copyright). A check would need each country's rules.
- **Measures:** SPEC.md feature 14's help note says that copyright laws differ between countries, and asks readers to check their local laws. It isn't built yet (#24).

## Build and tests

Code: `package.json`, `playwright.config.ts`, `.github/workflows/node.js.yml`. Tests: `e2e/`.

### Build-time packages have open npm advisories

- **What happens:** `npm audit` reports 4 moderate vulnerabilities (on 2026-11-24): `glob` and `minimatch`, and `workbox-build` and `vite-plugin-pwa`, which bring them in. Its fix, `npm audit fix --force`, would move `vite-plugin-pwa` back to 1.1.0, a breaking change.
- **Why it's left:** they run only during `vite build`, on the project's own config, and none of them ship to users (ADR 0006).
- **Measures:** update `vite-plugin-pwa` once `workbox-build` updates them.

### WebKit tests don't see the service worker's own requests

- **What happens:** in WebKit, Playwright doesn't report requests the service worker makes itself, such as the precache fetches. So the WebKit run of "requests only the app's own origin" (`e2e/pwa.spec.ts`) misses them. Possible cause: a Playwright limit.
- **Why it's left:** the Chromium run of the same test covers those requests.
- **Measures:** recheck if Playwright starts reporting service worker requests in WebKit.

### Firefox isn't in the automatic tests

- **What happens:** SPEC.md supports desktop Firefox, but `npm run e2e` and CI run only Chromium and WebKit (`playwright.config.ts`). Firefox is checked only by hand (SPEC.md, How features are checked).
- **Why it's left:** it takes time: adding it changes the dev container's image and the CI workflow, and needs a container rebuild (#51, #52).
- **Measures:** #52 adds it.

### Android is checked only by emulation

- **What happens:** SPEC.md supports Android Chrome, but the only check is `npm run e2e` in Chromium with Android phones' screens, touch and user agent, not Android itself (ADR 0010). Nothing checks the installed app, the file picker or the screen staying on in real Android Chrome; ADR 0010 lists the rest.
- **Why it's left:** there's no Android phone to check on reliably (#84), and the dev container can't run a real Android emulator (ADR 0010).
- **Measures:** #85 plans a run in real Android Chrome on emulators before v1.

## Dev container

Code: `.devcontainer/init-firewall.sh`, `.devcontainer/devcontainer.json`.

### A web page or an issue can carry instructions for the agent

- **What happens:** the agent reads web pages, since ports 80 and 443 are open, and reads issues and comments that anyone can post on this public repo. Text in them can be written to steer an AI agent (prompt injection). A steered session could send the GitHub token or the Claude login to another server, put a harmful change in a PR, or probably merge one (ADR 0012 lists what it can reach). Not seen in this project so far.
- **Why it's left:** adding sites one by one was too much work (#71). ADR 0012 rejects two stronger options: a separate research container needs its own paid API key, and a prompt before posting to GitHub wouldn't help a person spot a steered session.
- **Measures:**
  - ADR 0012's light checks: the `reviewer` subagent's list of sensitive changes, and CLAUDE.md's rule that outside text is information, never instructions.
  - If a session does something unexplained, revoke the GitHub token and log the Claude login out.
  - Before a rebuild, read `git diff .devcontainer/` on the PC, since `devcontainer.json`'s `initializeCommand` runs there (ADR 0012). Don't run a branch outside the container.

### The firewall fails open

- **What happens:** if `init-firewall.sh` fails at start, the container runs without the firewall, and the agent can reach any host (ADR 0004). How often this has happened is unknown.
- **Why it's left:** it comes with Anthropic's reference container, which ADR 0004 adopts.
- **Measures:** before starting Claude, check that the start log shows four `Firewall verification passed` lines (ADR 0012).
