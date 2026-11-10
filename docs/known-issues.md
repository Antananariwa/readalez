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
- **Why it's left:** with so few lines, a hard-wrapped text looks the same. Longer texts, and a heading above a paragraph line, split as expected (`src/core/paste.test.ts`).
- **Suggestions:** treat text as hard-wrapped only with at least a few wrapped lines, if short pastes turn out to matter.

### A pasted Gutenberg book's title can be a fragment

- **What happens:** the owner pasted the whole plain text of a Gutenberg book (_The Works of William Shakespeare_, Cambridge Edition, Vol. 8) on the iPhone, testing #57. The suggested title was `THE WORKS`, the first line after the `*** START OF` line, because the title page spreads the title over lines with blank lines between them. The field can be edited before saving.
- **Why it's left:** the apps checked don't guess more. [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/app-page.ts#L192-L193) titles pasted text "Pasted Text" unless one is typed. [Calibre](https://github.com/kovidgoyal/calibre/blob/ad42fa09dbc3993846cea83215e81acfd7683765/src/calibre/ebooks/metadata/txt.py#L22-L40) uses a TXT file's name, or its first line when three blank lines and an author line follow it. Neither reads Gutenberg's header.
- **Suggestions:** take the header's `Title:` line when the paste includes Gutenberg's header (not checked: whether every Gutenberg file has that line).

## Reader

Code: `src/ui/App.tsx`, `src/ui/Reader.tsx`, `src/ui/ProgressBar.tsx`. Added in #8, #10 and #11.

### The browser's Back leaves the app

- **What happens:** the library, Add text and the reader are React state, not history entries (`src/ui/App.tsx`). So the browser's Back button, or a swipe back, leaves Readalez instead of returning to the library. The app's own Back buttons work.
- **Why it's left:** first left when there were two screens (#8), and not revisited since the library (#12) made three.
- **Suggestions:** push a history entry when Add text or the reader opens and close it on `popstate`, or a router once there are more screens.

### Reading goes on for a while after swiping to the app switcher

- **What happens:** in the installed app on the owner's iPhone, swiping up from the bottom while words played left reading running with the app off screen. It stopped late, hard to tell exactly when. Pausing first, then switching apps, left it paused on return. Seen once, testing #59.
- **Why it's left:** reading does pause and never resumes on its own, as SPEC.md feature 7 asks. The owner chose to note it for later; it may also interact with notifications.
- **Suggestions:** Possible cause: the page counts as visible while the app shows as a card in the switcher, and `visibilitychange` (`src/ui/Reader.tsx`) fires only once the app is fully in the background (not checked). Also pausing on the window's `blur` or `pagehide` event might stop it sooner (not checked), to be tried on the iPhone.

### A stray tap or drag loses your place

- **What happens:** tapping a word in the paused view or moving the progress bar moves the frame there at once, and nothing leads back to where you were reading. The owner found it very annoying when it happened by accident, reviewing #68.
- **Why it's left:** the owner chose to record it for later (#68).
- **Suggestions:** after a tap or a drag, show a "Back to where you were" button for a while that returns to the word before the move. The open-source reader [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader#readme) has a "Back to my position" link for scrolling away while paused. Kindle's "Go back to page …" after jumping to another place is a similar idea (not checked).

### A tap on the marked word's left edge after a dash can pick the word before

- **What happens:** from reading the code, not checked in a browser: in the paused view, a tap on the left edge of the marked word's first letter, when a dash joins it to the word before ("yes—no" with "no" marked), can move the frame to the word before. The caret then sits at the end of the text before the `<mark>`, and `characterAt` (`src/ui/PausedText.tsx`) takes the character before the caret. Found while fixing the reviewer's finding in #68.
- **Why it's left:** it needs a tap on a sliver of one letter, and only where a dash joins two words. The owner chose to leave it for later (#68).
- **Suggestions:** when the caret is at the end of a text node, measure the first character of the next text node instead.

### The progress bar moves hundreds of words per pixel in a novel

- **What happens:** the bar has one step per word. The 1 MB text of "with a novel's worth of text" (`e2e/navigation.spec.ts`) has 192,560 words. At a 375-px viewport the bar is 343 px wide (the page's padding in `src/ui/styles.css`), about 560 words per pixel, so a drag can't land on a chosen sentence.
- **Why it's left:** letting go moves to the nearest sentence start (SPEC.md feature 7), and the sentence buttons and the paused view then reach the exact place.
- **Suggestions:** show the word or the percentage under the finger while dragging, or make the bar cover the chapter once EPUBs bring chapters (#15).

## Copyright

Code: `src/core/paste.ts`, `src/core/epub.ts` and `src/ui/AddText.tsx`, which add books without any copyright check; the help note is #24. Added in #82.

### Readalez doesn't check whether a book is free to read where you live

- **What happens:** Readalez reads any book a reader imports or pastes and checks nothing about its copyright. The only safeguard is a sentence in the help note on the Add text screen (SPEC.md feature 14): copyright laws differ between countries, so check your local laws.
- **Why it's left:** books readers add stay on their device and are never uploaded, so the app distributes nothing (SPEC.md, Legal and licensing), and a check would need each country's rules. The owner chose a note over any check (#83).
- **Suggestions:** none for v1. A catalog after v1 would choose its books by a copyright rule (docs/roadmap.md, "Public-domain catalog and proxy").

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
- **Suggestions:** #52 lists the steps.

### Android is checked only by emulation

- **What happens:** SPEC.md supports Android Chrome, but the only automatic check is `npm run e2e` in Chromium with Playwright's Android phone presets, which emulate a phone's screen, touch and user agent, not Android ([ADR 0010](adr/0010-test-android-chrome-by-emulation.md)). Nobody checks the installed app, the file picker or the screen staying on in real Android Chrome.
- **Why it's left:** the owner has no Android phone to check on reliably (#84). The dev container has no `/dev/kvm`, which an Android emulator needs to run at a usable speed (not checked, #85).
- **Suggestions:** #85 plans a run in real Android Chrome on emulators before v1.

## Dev container

Code: `.devcontainer/init-firewall.sh`. Added in #71.

### A web page or an issue can carry instructions for the agent

- **What happens:** the agent reads web pages, since ports 80 and 443 are open, and reads issues and comments that anyone can post on this public repo. Text in them can be written to steer an AI agent (prompt injection). A steered session could send the GitHub token or the Claude login to another server, or put a harmful change in a PR ([ADR 0012](adr/0012-open-web-ports-in-the-firewall.md) lists what it can reach). Not seen in this project so far.
- **Why it's left:** the owner chose open web access over adding sites one by one, and rejected a separate research container because it needs its own paid API key (#71). Both logins can be revoked, and only the owner merges.
- **Suggestions:** if a session does something unexplained, revoke the GitHub token and log the Claude login out. For more isolation later: research in a separate container with no logins, passing checked text to this one.

## Install and updates

Code: `vite.config.ts`, `src/ui/registerServiceWorker.ts`. Added in #40.

### A restart can still show the old version

- **What happens:** after a deploy, the owner's Chrome still showed the old version after a restart, until Ctrl+Shift+R loaded the new one (#40). In a test in headless Chromium and WebKit, with a relaunched Playwright profile standing in for a restart, the first launch after a deploy showed the old version and downloaded the new one, which waited; the launch after that showed the new one (#46).
- **Why it's left:** with `skipWaiting: false`, a new service worker waits while a page is open (#46), so an update never interrupts reading (SPEC.md feature 12).
- **Suggestions:** show an "Update ready" notice with a Reload button once the new version has downloaded, hidden while a book plays. The built service worker already accepts a `SKIP_WAITING` message, so `src/ui/registerServiceWorker.ts` could watch `registration.waiting`, post that message on Reload, then reload on `controllerchange`.

## Library

Code: `src/ui/storage.ts`, `src/ui/Library.tsx`, `src/core/position.ts`. Tests: `e2e/library.spec.ts`, `e2e/positions.spec.ts`. Added in #12 and #13.

### A rename made just before a reload can be lost

- **What happens:** the rename dialog closes as soon as Save is tapped, and the change is written to IndexedDB after that. In `e2e/library.spec.ts`, reloading the page right after the dialog closed showed the old title in 3 of 3 Chromium runs, while waiting for the list to show the new title first kept it (#12's PR). Deleting works the same way.
- **Why it's left:** the list shows the new title only once it's stored, so what's on screen is what's saved. How long the write takes is unknown; a person closing the app in that moment seems unlikely (not checked).
- **Suggestions:** keep the dialog open, with its buttons disabled, until the write has committed.

### Time left in the library is at 300 wpm, whatever speed you read at

- **What happens:** the library shows each book's time left at the default speed, 300 wpm (`src/ui/Library.tsx`). The reader's speed starts at 300 wpm each time a book opens and isn't stored (`src/ui/usePlayback.ts`).
- **Why it's left:** SPEC.md feature 4 asks for time left at the current speed, and the speed is stored with the settings in #18.
- **Suggestions:** once #18 stores the speed, pass it to the library.

### Books added before #13 show no progress until opened

- **What happens:** a book stored before #13 has no saved reading (ADR 0008), so its library row shows no progress or time left (`src/ui/Library.tsx`) until it's opened; opening saves the position at once (`src/ui/useSavePosition.ts`). `e2e/library.spec.ts` checks the row without them.
- **Why it's left:** working the figures out means splitting the book's text, which the library avoids (ADR 0007), and only books added between #12 and #13 are affected.
- **Suggestions:** work them out once for such books in the background after the library shows.

### Progress in the library can be out of date after an update

- **What happens:** a book's progress and time left in the library are worked out when its position is saved (ADR 0008). After an update that changes how words are split or timed, the library shows the old figures until the book is opened again. The position itself lands in the same paragraph (`src/core/position.test.ts`).
- **Why it's left:** working them out for every book on each visit to the library means splitting every text again, which took 1.3 s for 1 MB in Node (ADR 0007).
- **Suggestions:** store the version of the splitting rules with the figures, and work out the stale ones in the background after an update.

### A failed save of the reading position shows nothing

- **What happens:** if IndexedDB refuses a write, the position isn't saved and the reader shows no message (`src/ui/useSavePosition.ts`); the error reaches only the browser console. The next save tries again. Not seen yet; found while writing #13.
- **Why it's left:** what a reader should do about a failed save is unknown, and a full device is the likeliest cause (not checked).
- **Suggestions:** show a message once in the library if saves keep failing.

## EPUB import

Code: `src/core/epub.ts` and `src/core/epub/`. Tests: `src/core/epub.test.ts`, `src/core/epub/*.test.ts` and `tests/epub/fixtures.test.ts`. Added in #14.

### Named entities other than XML's five show as written

- **What happens:** `src/core/epub/xml.ts` replaces `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;` and numeric references. Any other named entity, such as `&nbsp;` or `&mdash;`, stays in the text as written, and the reader shows it as a word or part of one (`src/core/epub/xml.test.ts`). Not seen in the fixtures: the Standard Ebooks one uses only `&lt;` and `&gt;`.
- **Why it's left:** named entities need the document's DTD, which the reader doesn't load (ADR 0009). EPUB 3's XHTML can't use them (not checked), so only EPUB 2 books could.
- **Suggestions:** a table of XHTML 1.1's named entities, if a real book turns up with them.

### Unusual namespace prefixes lose verse and the nav

- **What happens:** the XML reader doesn't resolve namespaces (ADR 0009). Verse and the nav's `toc` are found through an attribute written `epub:type` (`src/core/epub/content.ts`, `src/core/epub/toc.ts`). A book that binds the EPUB namespace to another prefix has its verse read as prose, and its chapter list comes from the NCX, or from its headings if it has none. EPUB 2 author roles match a `role` attribute under any prefix (`attributesNamed` in `src/core/epub/package.ts`), so they aren't affected. Not seen in the fixtures.
- **Why it's left:** EPUB's own examples use `epub:` and `opf:` (not checked against a survey of real books), and resolving namespaces would add code for a case not yet seen.
- **Suggestions:** resolve `xmlns:` declarations in `xml.ts` and match attributes by namespace.

### Preformatted text loses its line breaks

- **What happens:** `src/core/epub/content.ts` collapses all whitespace, including inside `pre`, so its lines join into one paragraph. Not seen in the fixtures.
- **Why it's left:** `pre` is rare in the books Readalez is for (not checked).
- **Suggestions:** read each line of a `pre` as a line break.

## Reading flow and notes

Code: `src/core/epub/flow.ts`, `src/core/epub/content.ts`, `src/core/readingFlow.ts`. Tests: `src/core/epub/flow.test.ts`, `src/core/readingFlow.test.ts`, `tests/epub/fixtures.test.ts`, `e2e/readingFlow.spec.ts`. Added in #15 (ADR 0011).

### Books imported before #15 read whole

- **What happens:** the reading flow is worked out at import and stored with the text (ADR 0011). A book imported before #15 has none, so it opens, reads and counts progress from its first word to its last, Gutenberg's header and license included. Its chapter list shows, with nothing marked skipped.
- **Why it's left:** the flow needs the book's markup, which isn't stored, and only books imported between #14 and #15 are affected.
- **Suggestions:** delete the book and import it again; its reading position is lost.

### Paperwork without markup or a known title stays in the flow

- **What happens:** the flow's rules (SPEC.md feature 2) know paperwork from its markup or a few section titles. Two cases in the fixtures stay in the flow: _Pride and Prejudice_ (checked in `tests/epub/fixtures.test.ts`) ends with its printer's imprint ("CHISWICK PRESS:—CHARLES WHITTINGHAM AND CO. TOOKS COURT, CHANCERY LANE, LONDON."), and _Romeo and Juliet_ (seen with a script not in the repo, #15's PR) ends with a "Transcriber's Notes" box in bold, not a heading ("New original cover art included with this eBook is granted to the public domain.").
- **Why it's left:** both are a line or two before Gutenberg's footer, and rules for them would be guesses from one book each.
- **Suggestions:** treat a paragraph that is only "Transcriber's Notes" as a section title; recognise printers' imprints by a short list of words, if more books show them.

### A note written as plain text stays in the flow

- **What happens:** notes and their markers are taken out only when markup or a link marks them (SPEC.md feature 2). _A Connecticut Yankee in King Arthur's Court_ (Gutenberg #86) writes its three notes as plain text, each marked `*` on the word before it, and they're read in the flow (`tests/epub/fixtures.test.ts`):
  - one inside its paragraph: "No force,\* [\*Footnote from M.T.: No matter.] said Merlin";
  - two as their own paragraph after the marked one: "grace.\*" then "[\*Footnote: The story is borrowed, …]", and "Saints.\*" then "[\*All the details concerning the hermits, … —Editor ]".
- **Why it's left:** it's the book's own text, with nothing to tell a note from the sentence around it; seen in one book. A `*` or a superscript number without a link could also be part of the text.
- **Suggestions:** treat a bracketed passage starting with `[*` as a note and move it to the Notes section, if more books show this form (not checked). The same book also has a bracketed gloss with no marker, "as he were wood [\*demented], for fear", which that rule would take too.
