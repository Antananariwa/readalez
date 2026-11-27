# Known issues

This file lists the technical risks and technical debts in the app and its tooling that are accepted for now. It takes the form of [arc42's section 11](https://docs.arc42.org/section-11/). A fix removes its entry. Sections follow SPEC.md's v1 features in order, then the tooling. Each section opens with its code, and its tests when there are any. An entry's title says what happens, and three fields follow:

- **What happens:** the symptoms, the cause or "Possible cause: …", and where and how often it was seen, with its issue or PR.
- **Why it's left:** the reasoning.
- **Measures:** what would fix or mitigate it, when anything would.

## Pasted text

Code: `src/core/paste.ts` and its tests.

### A pasted Gutenberg book's title can be a fragment

- **What happens:** the title is the first line after Gutenberg's `*** START OF` line (SPEC.md feature 1, Title and author). A title page that spreads the title over several lines gives a fragment, such as `THE WORKS` for _The Works of William Shakespeare_, Vol. 8. Seen on an iPhone, testing #57.
- **Why it's left:** neither [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/app-page.ts#L192-L193) nor [Calibre](https://github.com/kovidgoyal/calibre/blob/ad42fa09dbc3993846cea83215e81acfd7683765/src/calibre/ebooks/metadata/txt.py#L22-L40) reads Gutenberg's header for a title.
- **Measures:** the title can be edited before saving and later in the library (SPEC.md feature 1). A fix: take the header's `Title:` line when the paste includes it (not checked: whether every Gutenberg file has one).

## EPUB import

Code: `src/core/epub.ts`, `src/core/epub/`, `src/ui/importEpub.ts`. Tests: their `*.test.ts`, `tests/epub/fixtures.test.ts`, `e2e/importEpub.spec.ts`.

### Named entities other than XML's five show as written

- **What happens:** a named entity such as `&nbsp;` shows in the text as written (`src/core/epub/xml.test.ts`), since `xml.ts` never loads the DTD that defines it (ADR 0009). Not seen in the repo's EPUBs (#130).
- **Why it's left:** EPUB 3.3 doesn't let an XHTML document name an external DTD ([section 3.9](https://www.w3.org/TR/epub-33/#sec-xml-constraints), [appendix B](https://www.w3.org/TR/epub-33/#app-identifiers-allowed)), so only EPUB 2 books can use XHTML 1.1's named entities, by naming its DTD.
- **Measures:** a table of XHTML 1.1's named entities, if a real book uses them.

### Unusual namespace prefixes lose verse and the nav

- **What happens:** `xml.ts` doesn't resolve namespaces (ADR 0009), so `content.ts` and `toc.ts` find verse and the nav's `toc` only by an attribute written `epub:type`. A book that binds the EPUB namespace to another prefix reads its verse as prose, and takes its chapter list from its NCX or its headings. Not seen in the repo's EPUBs (#130).
- **Why it's left:** resolving namespaces would add code for a case not seen.
- **Measures:** resolve `xmlns:` declarations in `xml.ts` and match attributes by namespace.

### Preformatted text loses its line breaks

- **What happens:** `src/core/epub/content.ts` collapses whitespace inside `pre` too, so a `pre`'s lines join into one paragraph of prose. Seen in the _Moby Dick_ and _Alice_ fixtures (#130).
- **Why it's left:** none of the built-in books uses `pre` (#130).
- **Measures:** read each line of a `pre` as a line break.

### An EPUB written with ZIP64 can fail to import

- **What happens:** `zip.ts` reads the central directory's 2- and 4-byte fields, and no ZIP64 records (ADR 0009). A ZIP64 archive sets a field at the end of the central directory to `0xFFFF` or `0xFFFFFFFF` ([APPNOTE.TXT, 4.4.1.4](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L663-L666)). When that field is the count of entries or the directory's offset, `openZip` throws `Bad central directory`. What a ZIP64 field on one entry does is not checked. Not seen in the repo's EPUBs, and no test covers it.
- **Why it's left:** ADR 0009 gives the reason: a book's EPUB is far below the sizes that need ZIP64. A writer may still use it: "ZIP64 format MAY be used regardless of the size of a file" ([4.3.9.2](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L431-L433)), and EPUB's ZIP containers "MAY use the ZIP64 extensions" ([EPUB 3.3, § 4.3.2](https://www.w3.org/TR/epub-33/#sec-zip-container-zipreqs)). Which tools write ZIP64 for a small EPUB is unknown.
- **Measures:** read the ZIP64 end of central directory record and its locator ([4.3.14 and 4.3.15](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L560-L631)), and the ZIP64 extra field ([4.5.3](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L1148)).

### A long book keeps the page busy while it's imported and opened

- **What happens:** importing an EPUB, as on a built-in book's first open, runs on the page's main thread, so the page can respond only between steps of splitting the text into words (`readEpub` in `src/ui/importEpub.ts`). Opening a book splits its whole text again in one go, with no progress shown (`read` in `src/ui/App.tsx`). In Node in the dev container, splitting _Moby Dick_'s fixture took 1.7 s, and parsing, timing and naming it 0.2 s (#97). iPhone times are unknown.
- **Why it's left:** for an import, a progress bar is less code than importing in the background (SPEC.md feature 2, Import progress). Whether opening is too slow waits on v1's performance targets (#73).
- **Measures:** split in a Web Worker, or make `splitText` faster.

## Reading flow and notes

Code: `src/core/epub/flow.ts`, `src/core/epub/content.ts`, `src/core/readingFlow.ts`. Tests: their `*.test.ts`, `tests/epub/fixtures.test.ts`, `e2e/readingFlow.spec.ts`.

### Paperwork without markup or a known title stays in the flow

- **What happens:** the reading flow's rules know publishing paperwork only by its markup or a few section titles (SPEC.md feature 2, Reading flow). So _Pride and Prejudice_'s printer's imprint stays at the end of its flow (`tests/epub/fixtures.test.ts`), and so does _Romeo and Juliet_'s "Transcriber's Notes" box, seen with a script (#89).
- **Why it's left:** each is a line or two before Gutenberg's footer, and a rule for either would be a guess from one book.
- **Measures:** read a paragraph that is only "Transcriber's Notes" as a section title, and know printers' imprints by a few words, if more books show them.

### A note written as plain text stays in the flow

- **What happens:** notes leave the flow only when markup or a link marks them (SPEC.md feature 2, Notes). _A Connecticut Yankee in King Arthur's Court_ writes its three notes as plain text, marked `*`, as in "No force,\* [\*Footnote from M.T.: No matter.] said Merlin". All three are read in the flow (`tests/epub/fixtures.test.ts`).
- **Why it's left:** a `*` or a number without a link can be part of the text, so nothing tells such a note from the text around it. It's seen in one book.
- **Measures:** read a bracketed passage starting with `[*` as a note, if more books use this form.

## Library

Code: `src/ui/Library.tsx`, `src/ui/storage.ts`, `src/ui/useSavePosition.ts`, `src/core/position.ts`. Tests: `src/core/position.test.ts`, `e2e/library.spec.ts`, `e2e/positions.spec.ts`.

### A rename made just before a reload can be lost

- **What happens:** the rename dialog closes before the new title is stored (`src/ui/Library.tsx`, `src/ui/App.tsx`). In `e2e/library.spec.ts`, a reload right after it closed showed the old title in 3 of 3 Chromium runs (#72). Deleting works the same way.
- **Why it's left:** the list shows the new title only once it's stored, so the screen never shows a title that isn't saved.
- **Measures:** keep the dialog open, with its buttons disabled, until the write has committed.

### Time left in the library is at 300 wpm, whatever speed you read at

- **What happens:** the library works out time left at the default speed, 300 wpm (`DEFAULT_WPM` in `src/ui/Library.tsx`), where SPEC.md feature 6 asks for the current speed.
- **Why it's left:** no speed is stored until #18 adds the settings.
- **Measures:** once #18 stores the speed, pass it to the library.

### Progress in the library can be out of date after an update

- **What happens:** after an update that changes how words are split or timed, the library shows each book's progress and time left from its last save until the book is opened again (ADR 0008).
- **Why it's left:** working them out on each visit to the library means splitting every text again (ADR 0008).
- **Measures:** store the version of the splitting rules with the figures, and work out stale ones in the background after an update.

### A failed save of the position shows nothing

- **What happens:** if IndexedDB refuses a write, the position isn't saved, and the error reaches only the browser console (`src/ui/useSavePosition.ts`). The next save tries again. Possible cause: a full device (not checked). Not seen; known from the code.
- **Why it's left:** what a reader should do about a failed save is unknown.
- **Measures:** show a message once in the library if saves keep failing.

## Timing

Code: `src/core/sentences.ts`, `src/core/schedule.ts`, `src/core/timeLeft.ts` and their tests.

### An abbreviation before a capitalised word ends the sentence

- **What happens:** an abbreviation that often ends a sentence ends one whenever the next word starts with a capital (SPEC.md feature 6, Abbreviations). So "the U.S. Army" pauses after `U.S.`.
- **Why it's left:** the capital-letter test is the simplest form of what sentence splitters do (SPEC.md feature 6, Abbreviations).
- **Measures:** Punkt-style statistics learned from real text, or a short list of words that commonly follow each abbreviation, such as `Army`.

### A sentence ending in a single capital letter gets no sentence pause

- **What happens:** a capital letter with a dot counts as an initial (`abbreviation` in `src/core/sentences.ts`), so "Look out for D. He has" gets no pause after `D.`, and `He` doesn't start a sentence. `I.` is the one exception. Seen in the repo's English EPUBs (#130).
- **Why it's left:** in those EPUBs, initials far outnumber such sentence ends (#130). A name follows an initial too, so the capital-letter test can't tell them apart.
- **Measures:** read a single capital as an initial only when another initial or a name follows, which needs a list of names or Punkt-style statistics.

### German ordinals get a sentence pause

- **What happens:** "am 3. Oktober" pauses after `3.`, and `Oktober` starts a sentence.
- **Why it's left:** in English, a number with a dot is rarely an ordinal. In the repo's English EPUBs, no number with a dot comes before a lowercase English word (#130).
- **Measures:** in German text, read a number with a dot as an ordinal when the next word is a month or starts with a lowercase letter. That needs the text's language.

### After a stall, one word can show for less than its time

- **What happens:** when the device stalls and the next word's scheduled end is still ahead, that word shows only until then, sometimes for a single frame (`tick` in `src/core/schedule.ts`, `src/core/schedule.test.ts`). The schedule is back on time after it.
- **Why it's left:** the fixed schedule is what stops drift (SPEC.md feature 6, No drift, no skipped words).
- **Measures:** start a new schedule when the next word would get less than half its time. At 1,000 wpm with 30 Hz frames, ordinary frames would then trigger it too, and reading would run slightly slow.

### Time left leaves out the pause after play

- **What happens:** time left counts the first word after play or a jump at its usual time (`timeLeft` in `src/core/timeLeft.ts`), but that word shows for at least 1.5× (SPEC.md feature 6, Starting values). So time left is up to half an ordinary word short each time you press play.
- **Why it's left:** No reason recorded.
- **Measures:** add the start factor to time left while paused.

## Reader

Code: `src/ui/App.tsx`, `src/ui/Reader.tsx`, `src/ui/PausedText.tsx`, `src/ui/ProgressBar.tsx`. Tests: `e2e/reader.spec.ts`, `e2e/navigation.spec.ts`.

### The browser's back button leaves the app

- **What happens:** the screens live in React state, not in the browser's history (`src/ui/App.tsx`). So the browser's back button, or a swipe back, leaves Readalez instead of returning to the library.
- **Why it's left:** No reason recorded.
- **Measures:** push a history entry when the Add text screen or the reader opens, and return to the library on `popstate`.

### Reading goes on for a while after swiping to the app switcher

- **What happens:** in the installed app on an iPhone, swiping up to the app switcher while words played left reading running off screen, until it stopped some time later. Seen once, testing #59. Possible cause: `visibilitychange` (`src/ui/Reader.tsx`) fires only once the app is fully in the background (not checked).
- **Why it's left:** reading does pause in the end, and never resumes on its own (SPEC.md feature 7, Pausing by itself).
- **Measures:** also pause on the window's `blur` or `pagehide` event (not checked: whether either fires sooner).

### A stray tap or drag loses your place

- **What happens:** tapping a word in the paused view, or letting go of the progress bar, moves the position at once and saves it (SPEC.md features 4 and 7), with no way back. It happened by accident while reviewing #68.
- **Why it's left:** No reason recorded.
- **Measures:** offer a way back to the word before the move for a while, as [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader#readme) does after scrolling away while paused.

### The progress bar moves hundreds of words per pixel in a novel

- **What happens:** the bar has one step per word of the reading flow (`src/ui/Reader.tsx`). In a novel, each pixel holds hundreds of words: about 560 for the 1 MB text in `e2e/navigation.spec.ts` at a 375-px viewport. So a drag can't land on a chosen sentence.
- **Why it's left:** letting go moves to the nearest sentence start (SPEC.md feature 7, Progress bar). Previous sentence, next sentence and the paused view then reach the exact place.
- **Measures:** show the word or the percentage under the finger while dragging, or make the bar cover the chapter.

## Install and updates

Code: `vite.config.ts`, `src/ui/registerServiceWorker.ts`. Tests: `e2e/pwa.spec.ts`, `tests/tooling/service-worker.test.ts`.

### A restart can still show the old version

- **What happens:** the first launch after a deploy shows the old version and downloads the new one, which shows from the next launch. Seen in desktop Chrome (#40), and in Chromium and WebKit with a relaunched Playwright profile (#46).
- **Why it's left:** a new service worker waits while a page is open (ADR 0006), so an update never interrupts reading (SPEC.md feature 12, Updates).
- **Measures:** #22 decides whether to add a notice that reloads into the new version, through the `SKIP_WAITING` message (ADR 0006).

## Where to find books

Code: `src/ui/AddText.tsx`.

### Readalez doesn't check whether a book is free to read where you live

- **What happens:** Readalez adds any pasted text or imported EPUB without checking its copyright.
- **Why it's left:** added books stay on the device, so the app distributes nothing (SPEC.md, Copyright). A check would need each country's rules.
- **Measures:** SPEC.md feature 14's help note asks readers to check their local laws. #24 builds it.

## Build and tests

Code: `package.json`, `playwright.config.ts`, `.github/workflows/node.js.yml`. Tests: `e2e/`.

### Build-time packages have open npm advisories

- **What happens:** on 2026-11-24, `npm audit` reports 4 moderate vulnerabilities: in `glob` and `minimatch`, and in `workbox-build` and `vite-plugin-pwa`, which bring them in.
- **Why it's left:** they run only during `vite build`, on the project's own config, and none of them ships to readers (ADR 0006). `npm audit fix --force` would move `vite-plugin-pwa` back to 1.1.0, a breaking change.
- **Measures:** update `vite-plugin-pwa` once `workbox-build` updates them.

### WebKit tests don't see the service worker's own requests

- **What happens:** in WebKit, Playwright doesn't report requests the service worker makes itself, such as the precache fetches. So the WebKit run of "requests only the app's own origin" (`e2e/pwa.spec.ts`) misses them. Possible cause: a Playwright limit.
- **Why it's left:** the Chromium run of the same test covers those requests.

### Firefox isn't in the automatic tests

- **What happens:** SPEC.md supports desktop Firefox, but `npm run e2e` and CI run only Chromium and WebKit (`playwright.config.ts`). So Firefox is checked only by hand.
- **Why it's left:** adding it needs the owner's access to the dev container's image and the CI workflow (#52).
- **Measures:** #52 adds it.

### Android is checked only by emulation

- **What happens:** SPEC.md supports Android Chrome, but `npm run e2e` only emulates two Android phones in Chromium (ADR 0005). Nothing checks Android itself:
  - the installed app: Chrome's install flow and the app's own window;
  - the system file picker, and where a download lands;
  - the wake lock keeping the screen on;
  - Chrome freezing or closing a page in the background;
  - storage eviction, the on-screen keyboard and real device speed.

  Whether Android Chrome differs from desktop Chromium in ways the tests miss is unknown.

- **Why it's left:** there's no Android phone to check on reliably (#84). The dev container has no `/dev/kvm` (#84). Without VM acceleration, the Android Emulator "must translate the machine code from the VM block by block", which "can be quite slow" ([Android Developers, Configure hardware acceleration](https://developer.android.com/studio/run/emulator-acceleration#hypervisors)). Whether a real Android emulator would be usable there is unknown (#85).
- **Measures:** #85 plans runs in real Android Chrome on emulators before v1.

## Dev container

Code: `.devcontainer/init-firewall.sh`, `.devcontainer/devcontainer.json`.

### A web page or an issue can carry instructions for the agent

- **What happens:** the agent reads web pages, and issues and comments that anyone can post on this public repo. Their text can be written to steer it (prompt injection). A steered session could send the GitHub token or the Claude login elsewhere, put a harmful change in a PR, or probably merge one (ADR 0012 lists what it can reach). Not seen in this project so far.
- **Why it's left:** adding sites one by one was too much work (#71). ADR 0012 rejects two stronger options and gives its reasons.
- **Measures:**
  - ADR 0012's two light checks.
  - If a session does something unexplained, revoke the GitHub token and log the Claude login out.
  - Before a rebuild, read `git diff .devcontainer/` on the PC, since `devcontainer.json`'s `initializeCommand` runs there (ADR 0012). Don't run a branch outside the container.

### The firewall fails open

- **What happens:** if `init-firewall.sh` fails at start, the container runs without the firewall, and the agent can reach any host (ADR 0004). How often this has happened is unknown.
- **Why it's left:** it comes with Anthropic's reference container, which ADR 0004 adopts.
- **Measures:** before starting Claude, check that the start log shows four `Firewall verification passed` lines (ADR 0012).
