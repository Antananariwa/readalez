# Spec

What Readalez does and why.

Tests and issues cite features by number. Each rule is an item in OpenFastTrace's shape ([ADR 0016](docs/adr/0016-write-spec-md-as-openfasttrace-items.md)): a title, what the app does, then `Rationale:` where the reason isn't obvious. Terms: [Glossary](#glossary). Technical choices: [docs/adr](docs/adr/).

## What Readalez is

A free, open-source speed-reading web app for practising on real, meaningful texts. v1 shows one word at a time with a highlighted focus letter. A PWA, installed from the browser ([ADR 0002](docs/adr/0002-pwa-in-typescript-and-react.md)).

### Public

Anyone with the link can use it. Privacy, copyright and polish are judged for strangers.

Rationale: A portfolio piece.

### Free and open source

MIT license.

Rationale: A public portfolio piece is open to read. Being free keeps the patent risk low ([Focus-point patents](#focus-point-patents)).

### Name

Readalez: a nod to Speedy Gonzales, in the name only. Neither the icon nor the app's text carries the Warner Bros. character or a reference to him.

Rationale: Short, and no other GitHub repository uses it (`gh search repos readalez`). Leaving the character out keeps clear of the trademark, and of the criticism of him as "an offensive Mexican stereotype" ([Wikipedia](https://en.wikipedia.org/wiki/Speedy_Gonzales)).

## Principles

For every feature.

### Everything stays on the device

No accounts, own server, analytics, cookies or ads. Texts, progress, settings and reading sessions live in browser storage; the backup file ([feature 9](#9-backup-file)) moves them between devices.

Rationale: Privacy without paperwork ([Privacy](#privacy)). No server to run or pay for ([ADR 0006](docs/adr/0006-host-on-cloudflare-pages.md)). Works offline.

### Established designs, simplest version first

Where speed-reading apps share a convention, Readalez follows it; a departure needs a reason. Each feature starts as the simplest version that works.

Rationale: A proven convention needs less tuning than a new design.

## Devices and browsers

### iPhone

iOS 18.4 and later, installed app and Safari.

Rationale: From 18.4, an installed web app can keep the screen awake (Screen Wake Lock in Home Screen web apps, MDN's [`api/WakeLock.json`](https://github.com/mdn/browser-compat-data/blob/8d371e9fb68c0cdc1908fa370358f6659aaec513/api/WakeLock.json#L26-L36)). Earlier, the screen dims and locks mid-chapter.

### Android

Current Chrome, installed app and tab. Checked by emulation only ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md), [known issue](docs/known-issues.md#android-is-checked-only-by-emulation)).

Rationale: 72% of mobile web use worldwide, October 2026 ([StatCounter](https://gs.statcounter.com/os-market-share/mobile/worldwide)), so a public app gets opened on them.

### Desktop

Current Chrome and Edge, installed app and tab. Current Firefox, tab only.

Rationale: Together 86% of desktop browser use worldwide, October 2026 ([StatCounter](https://gs.statcounter.com/browser-market-share/desktop/worldwide)).

### Not checked

Safari on Mac and iPad, in v1.

Rationale: Every checked browser adds a manual check per release.

### Orientation and language

Portrait and landscape. Interface in English.

## v1 features

1. [Add text by pasting](#1-add-text-by-pasting)
2. [Import EPUB files](#2-import-epub-files)
3. [Built-in books](#3-built-in-books)
4. [Library](#4-library)
5. [Single-word display](#5-single-word-display)
6. [Timing](#6-timing)
7. [Reader](#7-reader)
8. [Settings](#8-settings)
9. [Backup file](#9-backup-file)
10. [Reading sessions](#10-reading-sessions)
11. [Tuning screen](#11-tuning-screen)
12. [Install, offline and updates](#12-install-offline-and-updates)
13. [About, privacy and licenses](#13-about-privacy-and-licenses)
14. [Where to find books](#14-where-to-find-books)

### 1. Add text by pasting

A paste box on the Add text screen. Saving adds the text to the library and opens it at the first word.

Rationale: The quickest way in for articles and snippets. On iPhone, Safari's Reader view gives clean text to copy. A pasted text is usually read straight away, so it opens at once.

#### Paragraphs

Blank lines separate paragraphs. Hard-wrapped text (most lines break mid-sentence at similar lengths): single line breaks join with spaces. Otherwise each line is a paragraph. One section: no chapters, no verse lines, so a pasted poem follows these rules too.

Rationale: Safari's Reader view copies one paragraph per line. Gutenberg's plain text wraps about every 70 characters. Plain text doesn't mark chapters or verse; guessing them comes with TXT import ([roadmap](docs/roadmap.md#txt-pdf-word-and-other-formats)).

#### Gutenberg license text

With Gutenberg's `*** START OF` and `*** END OF` lines, only the text between them is kept.

Rationale: Reading starts at the first real word, as with EPUBs.

#### Title and author

Title: the first line of the kept text, cut at a word boundary to at most 60 characters. Editable before saving and later in the library; left blank, it saves as the first line. Author: **Unknown author**, as for an EPUB with none ([feature 2](#2-import-epub-files)): no extra field to fill in.

#### Same text twice

Adds nothing, and says so, with the copy's title and how far you've read. Offers to open that copy where you left off, or to cancel. Texts match by their words (ADR 0007).

Rationale: One book, one entry, and your progress stays. You are told, not dropped into a book without warning.

### 2. Import EPUB files

Importing an EPUB on the Add text screen opens the file picker. The book is read on the device and added to the library.

Rationale: Project Gutenberg, Standard Ebooks and Wikisource all offer EPUB, and it marks chapters and paragraphs.

#### Supported

EPUB 2 and 3 without DRM.

- Reading order: the book's spine.
- Chapter list: the book's table of contents, or its headings if it has none.
- Title and author: the book's metadata. Fallbacks: the file name, **Unknown author**.

#### Reading flow

From where the author's text starts to the author's last words, then the Finished card ([feature 7](#7-reader)). A book first opens at the flow's first word. Publishing paperwork stays out:

- cover, title and half-title pages
- copyright and imprint pages
- contents pages, lists of illustrations
- pages left empty once images are dropped
- Gutenberg's license pages

Everything the author wrote stays in: dedications, epigraphs, prefaces, afterwords, appendices. Paperwork between the author's parts is skipped without stopping. Each skipped part stays reachable from the chapter list; playing one reads it to its end and stops there.

Rationale: Some books put paperwork between the author's parts, such as a list of illustrations after the preface.

#### Notes

Note markers (¹, [12], \*) never show as words. The notes are gathered, in book order, into one notes section after the book, outside the reading flow, with its own chapter-list entry. Links into a note lead there.

Rationale: A marker flashing as a word breaks the flow. One entry reaches every note. A new last section leaves the book's other sections, and saved positions, where they were (ADR 0011).

#### Kept and dropped

- Headings, paragraphs, block quotes, list items, table rows: each reads as a paragraph.
- Each verse line ends with a pause ([feature 6](#6-timing)).
- Images: dropped, with their alt text and captions.
- Soft hyphens and zero-width characters: removed. Non-breaking spaces: read as spaces.

Rationale: Alt text and captions describe pictures that aren't shown.

#### Copy-protected and broken files

Not added, with a message saying why: a copy-protected book (a file Readalez reads is encrypted with anything other than font obfuscation), a file that isn't a readable EPUB, or one with a damaged file Readalez reads. Nothing half-imported reaches the library. Files Readalez never reads, such as images, styles and fonts, can be damaged or encrypted without stopping the import.

Rationale: Font obfuscation scrambles fonts for licensing, and Readalez never reads fonts.

#### Import progress

While a book is read: a progress bar on the Add text screen, and the screen's buttons disabled. The page can be slow to respond meanwhile ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)).

Rationale: Less code than importing in the background, and nothing else on the page is needed during an import.

#### New mark

A **New** mark on a book just imported, in the library. Stays until you open a book, go to the Add text screen or reload.

Rationale: An import lands in the library, not the book; the mark shows which book arrived.

#### Same book twice

As for pasted text ([Same text twice](#same-text-twice)). A different edition is a different book.

### 3. Built-in books

Free books in the library from the first visit, under the built-in books' library filter ([feature 4](#4-library)). Public domain in the US and the UK ([Built-in books' copyright](#built-in-books-copyright)). They can't be deleted or renamed.

Rationale: A new reader can try the app at once, with no import. Always something to read and to tune with; also test fixtures.

#### Editions

Standard Ebooks' editions, without their pictures. Each book's one-line summary comes from its metadata.

Rationale: Proofread, cleanly marked-up EPUB 3. Contributors dedicate their own work to the public domain under CC0 ([_A Christmas Carol_'s Uncopyright page](https://github.com/standardebooks/charles-dickens_a-christmas-carol/blob/fbcca8acb37169bbb560b8796c1f05b0240f6792/src/epub/text/uncopyright.xhtml)), so no license text to carry.

#### First open

Goes through the same import as the reader's own EPUBs, on first open, with a progress bar on its library row. Until then, listed at 0% with its time left.

Rationale: Importing all of them on the first visit would keep the page busy for a long time ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened), [ADR 0013](docs/adr/0013-ship-built-in-books-as-precached-epubs.md)).

### 4. Library

The home screen. Lists every book, built-in or own: most recently opened first, unopened last.

- Each book: title, author, progress, time left ([feature 6](#6-timing)), when last opened. A finished book shows as finished instead of progress and time left.
- A built-in book: also its one-line summary.
- Tapping a book opens it where you left off ([feature 7](#7-reader)), or a finished one on its Finished card.
- Own books: rename, and delete with a confirmation.

#### Library filters

Three: all books, built-in only, own only. Chips under the title: **All**, **Public**, **My books**. Exactly one is on; all books at first. Kept while you read a book and come back. A reload resets to all books.

Rationale: Google Play Books and Kindle filter a library by where its books come from (not checked: their help pages read only through search results). Three choices, one always on: plainly shows what the list holds. **Public**: free for anyone, as public-domain books are, without naming a genre, so a non-classic fits too. A reload resets until settings are stored (#18).

#### Saving progress

Saved:

- on pause, and at each move while paused
- on leaving the reader
- when the app goes to the background
- every 2 seconds while playing

Rationale: A backgrounded app can be closed without warning. Target: a reopened book at most 5 seconds of reading behind. 2 seconds leaves room for a write in flight and a late timer.

#### Progress and time left

Both measure the reading flow ([feature 2](#2-import-epub-files)): 0% at its first word, 100% at the Finished card. Progress: the flow's words before the position ÷ the flow's words. A position in a skipped part counts as 0% before the flow, 100% after it, and inside the flow as the flow's next word.

Rationale: The simplest rule that keeps progress moving forward through a book.

#### Positions survive updates

Stored by section, paragraph and word. If a later version splits words differently, you land in the same paragraph ([ADR 0008](docs/adr/0008-store-reading-positions-with-the-book.md)).

Rationale: Splitting rules will change as timing gets tuned.

### 5. Single-word display

One word at a time. Each word's focus letter is highlighted and lands on the same spot every time.

Rationale: Spritz's 2014 layout, copied by open-source readers such as [speedread](https://github.com/pasky/speedread). A reader's eyes land "between the beginning and middle of the word" ([The Conversation, 2014](https://theconversation.com/spritz-and-other-speed-reading-apps-prose-and-cons-24467)).

#### Focus letter

Set by the word's letter count. Only letters and digits count, not quotes or other punctuation. An accented letter counts, and is highlighted, as one letter, however it is encoded.

| Letters | Focus letter |
| ------- | ------------ |
| 1       | 1st          |
| 2–5     | 2nd          |
| 6–9     | 3rd          |
| 10–13   | 4th          |

Words over 13 letters are split first ([Long words](#long-words)).

Rationale: The convention's rows, as in speedread's [`find_ORP`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L93-L98). speedread counts punctuation too; Readalez doesn't, so a quote mark doesn't move the focus letter.

#### Fixed spot

The focus letter lands on the focus point, 40% of the way across the word frame. A thin line above and below the frame, each with a short tick at the focus point.

Rationale: The eyes never move. Left of centre: most of a word sits right of its focus letter. 40% because at a third, 5- and 6-letter words sat wholly in the left half of the screen (#36).

#### Highlight

The focus letter in the highlight colour, red by default; the rest of the word in the text colour. Settings:

- Highlight off: the focus letter takes the text colour and stays in place.
- A few highlight colours, each with at least 3:1 contrast against the background, in both themes.

Rationale: Some readers find the colour distracting; colour-blind readers need a choice. 3:1: WCAG's minimum contrast for large text ([WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)).

#### Long words

A word over 13 letters shows in parts of at most 13 letters, each with its own focus letter:

- Cut first at its own hyphens, or at a web address's slashes and dots.
- Only as many cuts as needed: "twenty-seven-year-old" shows "twenty-seven-", then "year-old".
- A part still over 13 letters: cut into the fewest even parts.
- Every part but the last ends with a hyphen, unless it already ends with a hyphen, slash or dot.

Rationale: 13 letters fit the word frame at the largest text size ([Text size](#text-size)). Cutting at a hyphen only while a part is too long gives fewer, fuller flashes, as SpritzerTextView does ([`Spritzer.java`](https://github.com/andrewgiang/SpritzerTextView/blob/8c5dd53843a6d6525d7faa7a4be9b69ee294142e/lib/src/main/java/com/andrewgiang/textspritzer/lib/Spritzer.java#L213-L268)).

#### Words

Text between spaces, with its punctuation attached.

- Hyphenated words and numbers stay whole: "well-known", "1,000.50".
- Words joined by an unspaced dash split after the dash, where both sides have a letter or digit: "yes—no" shows "yes—", then "no".
- Also dashes: `--`, `―`, `⸺`, `⸻`. Not the en dash (`–`): "1914–1918" stays whole.
- A piece with no letters or digits doesn't show on its own. A spaced dash or ellipsis joins the word before, with its space ("paused —").
- A line of only symbols, such as `* * *`: a scene break, ending a paragraph.
- Joined to the word after: opening quotes and brackets, `¿`, `¡`, and a symbol with no word before it, such as a dialogue dash opening a paragraph ("« Bonjour »", "— Привет,").
- `&` shows as a word.

Rationale: Spaces keep the text as written. An opening mark belongs to the word it opens, as in French, Spanish and Russian dialogue.

#### Text size

At the largest text size, a 13-letter word such as "comprehension" fits a 375-px-wide screen in portrait. A word that still doesn't fit shrinks while it shows; never clipped.

Rationale: No reason recorded for 375 px ([Open questions](#open-questions)).

### 6. Timing

Each word shows for a time set by the speed, plus pauses at punctuation, sentence ends, paragraph ends and headings. Chapter titles show as words; reading runs on into the next chapter without stopping.

#### Speed

100 to 1,000 words per minute, in steps of 10, starting at 300. One speed for all books. A change takes effect from the next word. The speed is the base speed: an ordinary word shows for 60,000 ÷ wpm milliseconds, 200 ms at 300 wpm. Pauses add to it, so the real average runs below the setting.

Rationale: No reason recorded for the range. Base speed: the convention of other Spritz-style readers ([ADR 0017](docs/adr/0017-start-timing-at-these-values.md)).

#### Starting values

| A word that…                                                       | Shows for                             |
| ------------------------------------------------------------------ | ------------------------------------- |
| is ordinary                                                        | 1×                                    |
| has 8 or more letters                                              | 1.3×                                  |
| ends with `,` `;` `:` a dash or a closing bracket                  | 1.5×                                  |
| ends a line of verse                                               | 2×                                    |
| ends a sentence (`.` `!` `?` `…`, also when closing quotes follow) | 2×                                    |
| ends a paragraph or a heading, or comes right before a heading     | 5×                                    |
| is the first after you press play or jump                          | the larger of 1.5× and its usual time |

- Of the punctuation rows, only the largest applies.
- The long-word factor multiplies it: a long word ending a sentence shows for 2.6×.
- Each part of a split word: timed by its own length, with the punctuation pauses on the last part. The hyphen added at a split isn't a dash.

Rationale: Where these values came from: [ADR 0017](docs/adr/0017-start-timing-at-these-values.md). Final values: [Open questions](#open-questions).

#### Abbreviations

- No sentence pause, unless it ends a paragraph: abbreviations that rarely end a sentence, such as titles, initials ("J. R. R."), "Mr.", "Dr.", "e.g.", French "M.", German "z. B.", Polish "np.".
- Abbreviations that often end a sentence, such as "etc." and "U.S.": end one when the next word starts with a capital letter.
- Known gaps: [docs/known-issues.md](docs/known-issues.md#timing-and-sentences).

Rationale: The simplest form of what sentence splitters such as [pySBD](https://github.com/nipunsadvilkar/pySBD) and [NLTK's Punkt](https://www.nltk.org/api/nltk.tokenize.punkt.html) do with abbreviations.

#### Languages

English, and European languages in Latin, Greek or Cyrillic script. Their quote marks and punctuation count as punctuation; Greek `;` is a question mark. Tuned on English first.

Rationale: These scripts split words at spaces and read left to right, as features [5](#5-single-word-display) and [6](#6-timing) assume ([Out of scope](#out-of-scope-for-v1)). The built-in books are in English.

#### No drift, no skipped words

Words follow a fixed schedule, so small timer delays don't add up. A device that falls behind slows reading rather than skip a word: every word is on screen for at least one refresh.

#### Time left

For the chapter and the book, at the current speed, from the same rules as the words' times, apart from [the pause after play](docs/known-issues.md#time-left-leaves-out-the-pause-after-play).

### 7. Reader

The screen where a book plays, one word at a time, in the word frame.

#### Controls

- Tapping the word frame plays or pauses.
- Below the frame, row 1: slower and faster, by 10 wpm, either side of the current speed. Row 2: Back and Forward.
- Holding slower or faster keeps changing the speed until you let go.
- Back: to the start of the sentence on screen; already at its start, to the start of the sentence before.
- Forward: to the start of the next sentence.
- Desktop: Space plays or pauses; ← and → are Back and Forward; ↑ and ↓ change the speed.

Rationale: One big tap target suits a phone. A second row costs screen space but keeps the controls apart for a first-time reader. Holding saves many taps, as on iPhone, where [`UIStepper`'s `autorepeat`](https://developer.apple.com/documentation/uikit/uistepper/autorepeat) is on by default. Back goes to the sentence start because play resumes at the word on screen, not the sentence start ([Resume where you left off](#resume-where-you-left-off)).

#### Resume where you left off

Play after a pause, or in a book just opened, starts at the word on screen.

Rationale: The paused view already shows the sentence and lets you pick any word; a jump to the sentence start on play would get in the way. Where play resumes and where Back goes become settings, default to be determined ([roadmap](docs/roadmap.md#reader-layout-options)).

#### Paused view

The current word stays in the word frame. Below it, the chapter's text, scrollable, with the current word marked. Tapping a word moves the word frame to it. A tap only moves: play stays with the word frame and Space, so a second tap on the word doesn't play.

Rationale: Helps you recover a lost thread. No reason recorded for a second tap not playing.

#### Chapter list

The chapters and every skipped part, including the notes and the publishing paperwork. Skipped entries marked as skipped; the current entry highlighted. Tapping an entry jumps to its start, paused. A part missing from the book's table of contents gets an entry titled with its first paragraph, cut as a pasted title is ([feature 1](#1-add-text-by-pasting)).

#### Progress bar

Draggable, over the reading flow. Letting go moves to the start of the nearest sentence. While playing: on screen, dimmed and locked; draggable only while paused.

Rationale: A drag while playing would move the place mid-reading.

#### Time left in the reader

The chapter's and the book's ([feature 6](#6-timing)), only while paused, in minutes and seconds (`h:mm:ss` from an hour).

Rationale: Seconds, so a chapter's time left can be checked with a stopwatch to within 2%. Hidden while playing: it draws attention from the words.

#### What a chapter is

For the paused view and the chapter's time left:

- From one chapter-list entry to the next, at any depth, so the deepest entry wins.
- Every part, skipped or not, also starts a chapter, so a chapter is wholly in or out of the flow.
- Before the first entry: from the start of the book.
- No chapter list, as in pasted text: the whole text is one chapter.
- A chapter can span the book's files.

Rationale: KOReader's rule ([readertoc.lua](https://github.com/koreader/koreader/blob/a3ebf281fc19483173b48e71b39ee5e949833385/frontend/apps/reader/modules/readertoc.lua#L598-L608)). A file can hold many chapters: Gutenberg's _Moby Dick_ has 135 chapters in 11 files ([fixtures](tests/fixtures/epub/README.md)).

#### Finished card

After the reading flow's last word. The book is marked finished.

- Shows: the reading flow's word count (no license or notes), your total reading time for it, your real average speed.
- Offers: back to the library, or start over. Starting over goes to the flow's first word, paused, and unmarks the book as finished.
- Keys do nothing while it shows.
- Word count: runs of text between spaces, so "yes—no" is one word.

Rationale: The simplest count. It needn't match the words shown exactly.

#### Pausing by itself

Reading pauses when the app goes to the background, the screen locks or the tab is hidden. It never resumes on its own.

#### Screen awake

The screen stays on while words play; once paused, it can lock as usual.

### 8. Settings

- speed
- highlight on or off, and its colour
- theme: follows the system, or light or dark
- text size
- backup file export and import ([feature 9](#9-backup-file))
- delete all data
- About ([feature 13](#13-about-privacy-and-licenses))

#### Delete all data

After a confirmation, removes own books, progress, settings and reading sessions. The built-in books stay, at 0%.

### 9. Backup file

One file carries own books' text, every book's progress, settings and reading sessions between devices. Export writes it; on iPhone, it can be saved to Files.

#### Import

Merges a backup into this device. Books match by text, as on one device ([feature 1](#1-add-text-by-pasting)), so the same edition imported on two devices is one book. Books missing here are added. For a book on both, the position from whichever device read it last wins. Sessions are combined without duplicates.

Rationale: A manual sync between iPhone and desktop.

#### Bad files

Not a Readalez backup, or from a newer version: a message, and nothing changes. Backups carry a format version, so later versions can read older backups.

### 10. Reading sessions

Recorded on the device per session: start time, book, words read, playing time, real average speed. In v1, shown only on the Finished card. Deleting a book keeps its sessions.

Rationale: Stats come after v1, and this way they start with a history.

#### Start and end

- Starts with play.
- Ends when the book is closed, when the app goes to the background, or after 5 minutes paused.
- Paused time doesn't count.
- Words read: the words shown while playing, re-reads included.

Rationale: A 5-minute break ends a sitting. Counting only playing time keeps the average speed honest.

### 11. Tuning screen

- A slider for every value in the timing table ([feature 6](#6-timing)), and one for the long-word threshold.
- Plays a passage from a built-in book at the current speed with the current values.
- Copies the values to the clipboard, as text to paste into an issue. Resets them to the defaults.
- Values apply on this device only, until a PR makes them the defaults.
- Reached through About, not the main settings.

Rationale: Timing feels robotic until tuned by feel on a device; a PR records the result. No reason recorded for its place behind About.

### 12. Install, offline and updates

#### Install

A full-screen app named Readalez, with its own icon, added through the browser: Safari's Add to Home Screen on iPhone, the install option in Chrome and Edge ([Devices and browsers](#devices-and-browsers)).

#### Offline

After the first visit, the app and every book work offline. The built-in books download with the app, in the background. A band at the top of the library shows how many are saved and asks you to stay online, then says the app is ready offline for the rest of the visit. If saving fails, it says so, with a reload to try again.

Rationale: Offline before the built-in books are saved, a book doesn't open, and only the band shows it.

#### Updates

Download in the background; apply at a later launch, never while you read.

#### Install tip

On the first visit in iPhone Safari, outside the installed app, a card explains:

- Safari and the installed app keep separate libraries.
- Safari deletes a site's script-writable storage after seven days of Safari use without interaction with the site.

It shows how to add the app to the Home Screen. Once dismissed, it doesn't return.

Rationale: A reader who stays in Safari can lose their books. Web apps added to the Home Screen "are not part of Safari and thus have their own counter of days of use" ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

#### Keep the data

The app asks the browser for persistent storage. When it asks: #22's choice.

Rationale: Persistent data "is only evicted, or deleted, if the user chooses to" ([MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).

### 13. About, privacy and licenses

About shows: version, source code link and its MIT license, privacy note, credits, third-party licenses, the way into the tuning screen. Credits: Standard Ebooks for the built-in editions, as a courtesy; Speeedy for any code taken from it ([Licenses of code](#licenses-of-code)). The privacy note says what [Everything stays on the device](#everything-stays-on-the-device) means for the reader's data, and that the web host serving the app's files handles requests as for any website; Readalez adds no logging.

#### No requests to other sites

System fonts; nothing from a CDN. The only outside links are ones you tap: the source code link in About, and the links in [feature 14](#14-where-to-find-books).

#### Licenses

Generated at build time: every bundled dependency, with its license text and any NOTICE file. Allowed licenses: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0, CC0-1.0. Any other fails the build.

Rationale: Readalez can then stay MIT, with every notice shipped.

### 14. Where to find books

A short help note on the Add text screen:

- links to Project Gutenberg and Standard Ebooks;
- the steps to download an EPUB and import it, on iPhone, Android and desktop;
- copyright laws differ between countries, so check your local laws before reading a book.

Readalez itself doesn't check a book's copyright ([known issue](docs/known-issues.md#readalez-doesnt-check-whether-a-book-is-free-to-read-where-you-live)).

Rationale: No catalog in v1, so readers need the way to free books.

## Out of scope for v1

Ideas for after v1: [docs/roadmap.md](docs/roadmap.md). Left out for other reasons:

- **Importing from a web link:** not planned. Needs a server that fetches any page: abuse and copyright trouble.
- **Sync and accounts:** not planned. Need a server holding personal data, so UK GDPR. The backup file covers moving between devices.
- **Accessibility conformance (WCAG):** not a v1 goal; too much work for v1.
- **Right-to-left, Chinese, Japanese and Korean texts:** need a mirrored layout or different word splitting: much more work.

## Legal and licensing

Working assumptions from public sources, not legal advice. Recheck before anything that changes the risk: charging money, adding a server, sync, analytics or a catalog.

### Copyright

Everything Readalez ships is free of copyright: built-in books, test fixtures, sample passages. Imported books stay on the device, so the app distributes nothing else.

Rationale: Everyone who opens the app, or the public repo, gets a copy.

### Built-in books' copyright

Public domain in the US and the UK. Every author and translator died before 1956; the build checks each one's death year. Translators count as authors here, to be safe.

Rationale: Standard Ebooks says each book is "believed to be in the United States public domain" but "may still be copyrighted in other countries" (each book's `dc:rights`). UK copyright "expires at the end of the period of 70 years from the end of the calendar year in which the author dies" ([Copyright, Designs and Patents Act 1988, section 12(2)](https://www.legislation.gov.uk/ukpga/1988/48/section/12)), so a death in 1955 or earlier means public domain from 2026. Not checked: whether the UK treats a translator as an author.

### Project Gutenberg

Gutenberg's name stays out of the app's name; v1 only links to Gutenberg. Its license pages stay out of the reading flow (features [1](#1-add-text-by-pasting) and [2](#2-import-epub-files)) but stay in the Gutenberg test fixtures.

Rationale: Gutenberg's license, in each of its books: "If you are redistributing or providing access to a work with the phrase “Project Gutenberg” associated with or appearing on the work, you must comply" with its terms (section 1.E.2, read in `tests/fixtures/epub/gutenberg-11-alice-in-wonderland-epub3.epub`). A catalog would bring more of its rules ([roadmap](docs/roadmap.md#public-domain-catalog-and-proxy)).

### Focus-point patents

The fixed focus point ([feature 5](#5-single-word-display)) is what Spritz's patents describe: [US 8,903,174](https://patents.google.com/patent/US8903174B2/en), the related US 9,483,109 and US 10,332,313, and a European family member validated in Spain as ES 2700224 T3. UK coverage: unknown. "Spritz" stays out of the name and the app's text.

Rationale: Low risk for a free, open-source app. Free apps use the design openly, such as the readers in [feature 5](#5-single-word-display).

### Privacy

No personal data collected ([Everything stays on the device](#everything-stays-on-the-device)). Device storage holds only what the features in use need: no consent banner.

Rationale: PECR, the UK's rules on device storage, exempts storage "strictly necessary for the provision of an information society service requested by the subscriber or user" ([PECR, Schedule A1, paragraph 4](https://www.legislation.gov.uk/uksi/2003/2426/schedule/A1)).

### Licenses of code

- Code copied or adapted from Speeedy (`sami-29/speeedy`, MIT) keeps its copyright notice.
- Speeedy's test fixtures are never copied: one is a copyrighted book ([`test-fixtures/01-11-2020-212827The 7 Habits of Highly Effective People.pdf`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/test-fixtures/01-11-2020-212827The%207%20Habits%20of%20Highly%20Effective%20People.pdf)).

## How features are checked

A feature's checks live in its tests, which cite it by number, and in its issue until it's built. Kinds:

- **Unit:** unit tests run by `npm run check`, mostly in `src/core` (ADR 0003).
- **E2E:** Playwright against the production build, in Chromium, WebKit with iPhone emulation, and Chromium with Android emulation (ADR 0005, [ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)).
- **Build:** a check run as part of the build.
- **Review:** by reading the diff. [docs/reviews.md](docs/reviews.md) collects each merged PR's review.
- **Device:** by hand on the iPhone's installed app and in the desktop browsers ([Devices and browsers](#devices-and-browsers)). #74 lists built features' device checks not yet done; an unbuilt feature's issue lists its own.

## Open questions

- **Final timing values:** set after tuning on a device ([feature 11](#11-tuning-screen)); [feature 6](#6-timing) holds starting values.
- **Speed and size targets:** which ones v1 sets, and at what values (#73).
- **App icon and visual style:** not decided.
- **Narrowest screen for the largest text size:** [feature 5](#5-single-word-display) uses 375 px, with no recorded reason. Android emulation runs at 360 px ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)), where "comprehension" fits with about 8 px to spare ([#87](https://github.com/Antananariwa/readalez/pull/87)).

## Glossary

One term per thing, in this file, the other docs and the code.

| Term                 | Definition                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backup file          | the file that moves a reader's data between devices ([feature 9](#9-backup-file)).                                                                                                                           |
| Base speed           | the speed setting, in words per minute: an ordinary word's time, before pauses ([feature 6](#6-timing)).                                                                                                     |
| Book                 | any text in the library: built-in or own.                                                                                                                                                                    |
| Built-in book        | a book shipped with the app ([feature 3](#3-built-in-books)).                                                                                                                                                |
| Chapter              | from one chapter-list entry to the next ([What a chapter is](#what-a-chapter-is)).                                                                                                                           |
| Chapter list         | the reader's list of a book's chapters and skipped parts (features [2](#2-import-epub-files) and [7](#7-reader)).                                                                                            |
| Copy-protected       | an EPUB Readalez won't import because a file it reads is encrypted ([feature 2](#2-import-epub-files)).                                                                                                      |
| Finished card        | shown after the reading flow's last word ([feature 7](#7-reader)).                                                                                                                                           |
| Focus letter         | the letter of a word that lands on the focus point, in the highlight colour ([feature 5](#5-single-word-display)).                                                                                           |
| Focus point          | the fixed spot in the word frame where every focus letter lands ([feature 5](#5-single-word-display)).                                                                                                       |
| Install tip          | the iPhone Safari card on installing to the Home Screen ([feature 12](#12-install-offline-and-updates)).                                                                                                     |
| Library filter       | which books the library lists: all, built-in or own ([feature 4](#4-library)).                                                                                                                               |
| New mark             | the mark on a book just imported ([feature 2](#2-import-epub-files)).                                                                                                                                        |
| Note marker          | a link in the text to a note ([feature 2](#2-import-epub-files)).                                                                                                                                            |
| Own book             | a book the reader added by pasting or importing.                                                                                                                                                             |
| Part                 | a stretch of an EPUB, cut at its chapter-list entries, its headings and changes in the markup's role. In the reading flow or skipped ([feature 2](#2-import-epub-files)).                                    |
| Paused view          | the chapter's text under the word frame while paused ([feature 7](#7-reader)).                                                                                                                               |
| Position             | a place in a book, to the word, saved so reading resumes there ([feature 4](#4-library), ADR 0008).                                                                                                          |
| Progress             | how far a position is through the reading flow, 0% to 100% ([feature 4](#4-library)).                                                                                                                        |
| Publishing paperwork | the parts of a book that aren't the author's text, such as cover, copyright and license pages ([feature 2](#2-import-epub-files)). Front matter comes before the reading flow, back matter after.            |
| Reading flow         | what plays from start to finish: the author's text, without paperwork or notes ([feature 2](#2-import-epub-files), ADR 0011).                                                                                |
| Reading session      | one sitting of reading a book, recorded on the device ([feature 10](#10-reading-sessions)).                                                                                                                  |
| Section              | a stretch of a book's stored text: one per file in an EPUB's reading order, plus one for its notes if any; one for a whole pasted text (features [1](#1-add-text-by-pasting) and [2](#2-import-epub-files)). |
| Time left            | how long the rest of a chapter or of the reading flow takes at the current speed ([feature 6](#6-timing)).                                                                                                   |
| Tuning screen        | the screen with a slider for each timing value ([feature 11](#11-tuning-screen)).                                                                                                                            |
| Word                 | what the word frame shows at one time; [feature 5](#5-single-word-display) says where text is cut into words.                                                                                                |
| Word frame           | where the word shows in the reader ([feature 5](#5-single-word-display)).                                                                                                                                    |
