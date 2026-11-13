# Spec

What Readalez does and why. Each feature issue links the feature it builds, whose checks below are its acceptance criteria, and adds only what is specific to the issue: which part of the feature it covers, its open questions and any extra checks. Each check says where it runs (see [How features are checked](#how-features-are-checked)). The reasons behind technical choices live in [docs/adr](docs/adr/). It's an educated guess: thought through, but not assumed always true, and corrected as Readalez grows and meets real books, devices and readers.

## What Readalez is

A free, open-source speed-reading web app for practicing on real, meaningful texts. v1 shows one word at a time with a highlighted focus letter; guided reading through full paragraphs comes later. It's a PWA (ADR 0002), so it installs from the browser on iPhone, Android and desktop.

- **Public.** Anyone with the link can use it. Why: it's a portfolio piece (#44). So privacy, copyright and polish are judged for strangers, not only for the owner.
- **Free and open source (MIT).** Why: a public portfolio piece; it also keeps the patent risk low (see [Legal and licensing](#legal-and-licensing)).
- **Named Readalez**, a nod to Speedy Gonzales. Why: catchy and original (`gh search repos readalez` found only this repo on 2026-11-03, #48; apps not checked), its 8 letters fit under an iPhone icon, and it avoids the Project Gutenberg and Spritz names. The nod stays in the name only: no mouse, sombrero, "¡Ándale!" or other reference to the Warner Bros. character in the icon or the app's text. That keeps clear of their trademark and of the criticism the character has drawn as a stereotype.

## Principles

These apply to every feature.

- **iPhone first.** Every v1 feature works in the installed Home Screen app on iOS 18.4 or later, and in a Safari tab. Why: the owner reads on an iPhone, and Safari is how a PWA installs there (ADR 0002).
- **Everything stays on the device.** No accounts, no server of our own, no analytics, no cookies, no ads. Texts, progress, settings and reading sessions live in the browser's storage, and a backup file moves them between devices. Why: privacy without paperwork (see [Legal and licensing](#legal-and-licensing)), no server to run or pay for (the app's files are hosted for free, [ADR 0006](docs/adr/0006-host-on-cloudflare-pages.md)), and the app works offline.
- **Established designs, simplest version first.** Where speed-reading apps share a convention (the focus letter, pause lengths), Readalez follows it, and departures need a reason. Each feature starts as the simplest version that works. Why: proven conventions need less tuning than new designs.

## Devices and browsers

- **iPhone:** iOS 18.4 and later, in the installed app and in Safari. Why: 18.4 is the first version where an installed web app can keep the screen awake while you read: MDN's compatibility data lists the Screen Wake Lock API on iOS from 16.4, but not in Home Screen web apps until 18.4 ([`api/WakeLock.json`](https://github.com/mdn/browser-compat-data/blob/8d371e9fb68c0cdc1908fa370358f6659aaec513/api/WakeLock.json#L26-L36)). On earlier versions the screen dims and locks mid-chapter. It covers iPhone XS and XR (2018) and newer. caniuse still lists the Home Screen bug, with no version ([`features-json/wake-lock.json`](https://github.com/Fyrd/caniuse/blob/dfffa8fdef1b8b5896b85717c7d86df11644187d/features-json/wake-lock.json#L24-L28)), so feature 7's screen-awake device check runs as early as possible.
- **Android:** current Chrome, in the installed app and in a tab. It's checked by the e2e tests in Chromium with Playwright's Android phone emulation on every PR ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)), and in real Android Chrome on emulators before v1 (#85), with no device checks ([known issue](docs/known-issues.md#android-is-checked-only-by-emulation)). Why: the owner decided to support it, with no Android phone to check it on reliably (2026-11-09, #84).
- **Desktop:** current Chrome, Edge and Firefox. Chrome and Edge can install the app; Firefox runs it in a tab. Why: together they cover most desktop users (#44).
- **Not checked in v1:** Safari on Mac and iPad. They run the same engine as iPhone Safari (not checked) and will likely work, but nobody checks them. Why: every checked browser adds a manual check per release. An Android store app through Capacitor is an idea for later ([roadmap](docs/roadmap.md#android-store-app)).
- Portrait and landscape both work. The interface is in English.

## v1 features

Fourteen features.

### 1. Add text by pasting

A paste box on the Add text screen. Saving adds the text to the library and opens it at the first word. Why: the quickest way in for articles and snippets; on iPhone, copy from Safari's Reader view.

- **Paragraphs.** Blank lines separate paragraphs. If the text is hard-wrapped (most lines break mid-sentence at similar lengths, as in Gutenberg's plain-text files), single line breaks are joined with spaces; otherwise each line is its own paragraph. Why: text copied from Safari's Reader view has one paragraph per line, Gutenberg's wraps about every 70 characters, and both should read as written.
- **Gutenberg license text.** If the text contains Gutenberg's `*** START OF` and `*** END OF` lines, only the part between them is kept. Why: reading starts at the first real word, as with EPUBs.
- **Title.** The first line of the text kept (so not Gutenberg's header), cut at a word boundary to at most 60 characters. It can be edited before saving and later in the library; a title left blank saves as the first line. Why: the title should name what you read, and a text always needs one for the library.
- **Author.** A pasted text's author is "Unknown author", the fallback EPUBs use (feature 2). Why: one rule for every book, with no extra field to fill in (the owner's choice, #12).
- **Same text twice.** Saving a text already in the library adds nothing and says so, as for EPUBs (feature 2), offering Open (the copy you have, with its title and progress) and Cancel. Texts match by their words (ADR 0007). Why: one book, one entry (the owner's choice, #12).
- **No chapters.** Pasted text is one section. Why: books come in as EPUB; guessing chapters from plain text returns with TXT import, after v1.
- **No verse.** Pasted text carries no verse markup, so a pasted poem follows the paragraph rules above; verse pauses (feature 6) come from EPUBs.

Checks:

- Unit: a hard-wrapped Gutenberg chapter comes out as its original paragraphs; text with one paragraph per line keeps each line as a paragraph.
- Unit: Gutenberg's header and footer, marker lines included, are left out.
- Unit: the title is the first line, cut at a word boundary to 60 characters.
- E2E: after pasting and saving, the reader opens at the first word, and the library lists the text under its title.
- Device: an article copied from Safari's Reader view on iPhone reads paragraph by paragraph.
- Device: a novel's worth of text (about 1 MB) pastes and saves on iPhone without freezing or crashing.

### 2. Import EPUB files

Import EPUB on the Add text screen opens the file picker (Files on iPhone). The book is read on the device and added to the library, marked New. Why: Project Gutenberg, Standard Ebooks and Wikisource all offer EPUB, and it marks chapters and paragraphs.

- **Supported:** EPUB 2 and 3 without DRM. The reading order is the book's spine. The chapter list comes from the book's table of contents, or from its headings if it has none.
- **Reading starts where the author's text starts** the first time a book opens. Publishing paperwork stays out of the reading flow: the cover, title and half-title pages, copyright and imprint pages, contents pages, lists of illustrations, pages left empty once images are dropped (such as a frontispiece) and Gutenberg's license pages. Everything the author wrote stays in, from dedications, epigraphs and prefaces to afterwords and appendices; a preface counts even when the book's markup places the main text after it, as Standard Ebooks does. Why: you open a book to read it, not its paperwork.
  - **How parts are recognised** (`src/core/epub/flow.ts`): the book is cut into parts at its chapter-list entries, its headings and wherever the markup's role changes. The markup decides first: EPUB 3 semantics (`epub:type` and DPUB-ARIA roles), the EPUB 2 guide, and Gutenberg's header and footer (`pg-header`, `pg-footer`). Then section titles: a contents page or list of illustrations anywhere, and a part titled with the book's own title before the author's text starts. A part of headings only goes with the part after it, unless the markup marks that part; a part with no title continues the one before it.
  - **The flow runs from the author's first part to the last**, and skips paperwork between them, such as _Pride and Prejudice_'s list of illustrations between its preface and Chapter I, or Standard Ebooks' half-title page after a preface (`tests/epub/fixtures.test.ts`). Reading jumps over a skipped part without stopping. Why: those books place paperwork there, and reading a list of page numbers isn't reading the book.
- **The reading flow ends with the author's last words**, where the Finished card shows (feature 7). Back-matter paperwork (colophons, copyright pages, Gutenberg's closing license) comes after it. Why: finishing a book shouldn't mean reading its license.
- **Everything skipped stays reachable** from the chapter list. Playing a skipped section reads it to its end and stops there.
- **Notes.** Note markers (¹, [12], * and other links to notes) never appear in the word stream. A marker is a link marked as a note reference (`epub:type="noteref"`, `role="doc-noteref"`, Gutenberg's class `fnanchor`), or an internal link whose whole text is a number, letter or symbol in brackets, symbols such as `*` and `†`, superscript digits, or a number in superscript. The notes themselves (footnotes and endnotes marked as such, or Gutenberg's class `footnote`) are gathered, in book order, into one Notes section after the book, outside the reading flow, with its own "Notes" entry in the chapter list; links into a note lead there. Why: a marker flashing as its own word breaks the flow, and one entry reaches every note, where notes skipped in place would leave the chapter list without a way to them. Each book's own sections keep their places (ADR 0011).
- **Kept:** headings, paragraphs, block quotes, list items and table rows (each one a paragraph), and line breaks in verse (each gets a pause, see feature 6). **Dropped:** images, with their alt text and captions, since they describe pictures that aren't shown. Soft hyphens and zero-width characters are removed, and non-breaking spaces read as spaces.
- **Title and author** come from the book's metadata, falling back to the file name and "Unknown author".
- **Copy-protected books** show "This book is copy-protected (DRM), so Readalez can't open it." A book is copy-protected when its `META-INF/encryption.xml` lists a file Readalez reads as encrypted with anything other than font obfuscation (`src/core/epub/encryption.ts`). Fonts scrambled for licensing (EPUB font obfuscation) are not DRM, and those books open. Why: EPUB 3.3 lists every encrypted file there, and calibre treats any algorithm but font obfuscation as DRM (both linked in `encryption.ts`). Whether store books (Apple Books, Adobe DRM) are recognised this way is not checked on real files. Kindle formats aren't imported in v1; they're an idea for later ([roadmap](docs/roadmap.md#kindle-formats-mobi-azw-kfx)).
- **Errors.** A file that isn't a readable EPUB, or one where a file Readalez reads from it is damaged (doesn't match the CRC-32 the archive gives it), shows "Couldn't read this EPUB.", and nothing half-imported appears in the library. Damaged images, styles and fonts go unnoticed, since Readalez never reads them.
- **Progress.** While a book is read, a progress bar shows under Import EPUB, and Back, Import EPUB and Save are disabled. The import runs on the page itself, so the page can be slow to answer meanwhile ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)). Why: the owner chose a bar on the page over importing in the background, as less code (#97).
- **New mark.** A book just imported shows in the library with a green border and a "New" label beside its options button, until you open a book, go to Add text or reload. Why: after importing you land in the library rather than in the book, so the mark shows which book arrived (the owner, testing #14). Pasted text still opens at once (feature 1), since a paste is usually read straight away.
- **Same book twice.** Importing a book whose text is already in the library adds nothing and says so, with how far you've read it, offering Open (the copy you have, where you left off) and Cancel. Why: you're told rather than dropped into a book without warning (the owner, testing #14), and the progress stays. A different edition is a different book.

Checks:

- Unit: for fixture EPUBs (a Standard Ebooks EPUB 3, a Gutenberg EPUB 3 and a Gutenberg EPUB 2), the chapter list matches each book's contents, and the reading flow starts where the author's text starts, with no cover, title, copyright, contents or license words before it.
- Unit: no note markers appear in the word stream, and the notes are outside the reading flow.
- Unit: a DRM-encrypted fixture gives the DRM message; a fixture with obfuscated fonts opens.
- Unit: a corrupt ZIP and a renamed text file each give an error and leave the library unchanged.
- Unit: soft hyphens and zero-width characters are gone, and each verse line ends with a line-break pause.
- E2E: importing a fixture adds it with the title and author from its metadata and shows it in the library marked New, until it is opened, Add text is opened or the page reloads; opening it starts where the author's text starts; importing it again says it's already in the library, adds no duplicate, and Open opens the copy there.
- Device: on iPhone, an EPUB downloaded from Standard Ebooks in Safari, saved to Files and imported in the installed app shows in the library marked New and opens where the author's text starts.
- Device: a 600,000-word EPUB (about the length of _War and Peace_) imports on the owner's iPhone, with the progress bar moving, and shows in the library marked New.

### 3. Built-in books

Twenty-four free books are always in the library, under its Public chip (feature 4), from the first visit. The list, with where each comes from, is `BOOKS` in `scripts/build-books.ts`: from _The Strange Case of Dr. Jekyll and Mr. Hyde_ (25,664 words) to _Dracula_ (161,105), counted by Standard Ebooks. Why: so a new reader can try the app at once, with no import to go through first, and pick something they like; the owner gets real books for tuning, and they double as test fixtures for EPUB import. Two dozen rather than a handful, so there's a real choice, as in reading apps that come with a library of texts (which ones: not checked); the limit is that the app shouldn't get noticeably slower or heavier (#17).

- **Which books:**
  - English prose in Standard Ebooks' editions: novels, novellas, stories and a little non-fiction.
  - A spread of genres (adventure, mystery, science fiction, horror, humour, children's classics, philosophy) and of lengths, from under 2 hours at 300 wpm to over 10.
  - No plays or poetry collections, which read badly one word at a time (#79), and no collections of hundreds of thousands of words, such as Standard Ebooks' Poe ([318,069 words](https://github.com/standardebooks/edgar-allan-poe_short-fiction/blob/6d9f9c4e0330abb5fb31918190d17a86a888329f/src/epub/content.opf#L110)) or O. Henry ([894,604](https://github.com/standardebooks/o-henry_short-fiction/blob/895b7438789028b276739a052da69b08df9d4680/src/epub/content.opf#L102)).
  - Each is public domain in the US (Standard Ebooks' check) and in the UK (see [Legal and licensing](#legal-and-licensing)).
  - Why: the books should suit reading word by word and a first try at the app.
- **Editions:** Standard Ebooks, built by `npm run books` from a pinned commit of each book's repository on GitHub, without its pictures. Why:
  - Proofread, cleanly marked-up EPUB 3, and their own work is dedicated to the public domain (CC0, in each book's `src/epub/text/uncopyright.xhtml`, for example [_A Christmas Carol_'s](https://github.com/standardebooks/charles-dickens_a-christmas-carol/blob/fbcca8acb37169bbb560b8796c1f05b0240f6792/src/epub/text/uncopyright.xhtml)), so there's no license text to carry.
  - Each book's metadata gives its one-line summary and genres (`schema:abstract` and `schema:genre` in `content.opf`).
  - Pages left empty without the pictures, such as a frontispiece, and lists of illustrations stay in the file. The reading flow skips them (feature 2), so taking them out too would mean rewriting each book's package and table of contents for no difference in reading.
- **Copyright:** all are public domain (see [Legal and licensing](#legal-and-licensing)).
- **Permanent:** they can't be deleted or renamed; the My books chip (feature 4) hides them. Their progress works like any book's, and Delete all data resets it. Why: so there's always something to read and to tune with.
- **One code path:** they ship as EPUB files and go through the same import as the reader's own books, when one is first opened. A progress bar shows on its row in the library meanwhile, and it then opens where its reading flow starts. Until then, the library lists it from a catalog built with the files (`src/core/builtInBooks.ts`), at 0% with its time left. Why: importing all of them on the first visit would keep the page busy for a long time ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)); [ADR 0013](docs/adr/0013-ship-built-in-books-as-precached-epubs.md).
- **Offline:** they all download with the app, about 4.2 MB, and work without a network after the first visit. Why: every book then works offline once the app has loaded, as feature 12 promises, at the cost of a first download about 13 times the app's own (#17).
- **Backups** hold their progress, not their text.

Checks:

- E2E: a fresh install lists every built-in book at 0%, with its summary, and one opens where its author's text starts (feature 2) and plays.
- E2E: built-in books offer no rename or delete; after Delete all data they're still listed, at 0%.
- E2E: after the first visit, with the network off, a built-in book never opened before opens and plays.
- Unit: every shipped EPUB contains no images, each one's reading flow starts where its author's text starts, and the catalog matches the files.

### 4. Library

The app's home screen: every book, built-in or your own, most recently opened first and unopened books last, so the book you're reading is on top. Each shows its title, author, progress, time left at the current speed and when it was last opened; built-in books also show their one-line summary. Tapping a book opens it where you left off (feature 7 says where reading resumes). Your own books (pasted or imported) can be renamed and deleted, with a confirmation.

- **All, Public and My books.** Three chips under the title filter the list: All shows every book, Public only the built-in books, My books only your own. One is always on, All at first. The chip stays on while you read a book and come back, and a reload goes back to All. Why: one library, filtered by where its books come from, as Play Books (purchases, uploads, samples), Kindle (books, samples, docs) and Spotify's Your Library ("By you", "By Spotify") filter theirs ([Play Books](https://support.google.com/googleplay/answer/9402600), [Kindle](https://www.pcworld.com/article/3538389/how-to-organize-your-kindle-library.html), [Spotify Community](https://community.spotify.com/t5/Spotify-Answers/How-can-I-search-filter-and-sort-in-Spotify/ta-p/4649789); read through web search results, not the pages). Three choices with one always on show plainly what the list holds; two chips that switched off to show everything were confusing to use, testing on an iPhone ([#98](https://github.com/Antananariwa/readalez/pull/98#issuecomment-6863828631)). "Public" is short and says the books are free for anyone, as public-domain books are, without naming a genre, so a book that isn't a classic fits too. The first version was "Free shelf"; "Classics" was weighed and dropped for that reason (#98). Remembering the chip across reloads waits for stored settings (#18). Filters by genre or author, and search: [roadmap](docs/roadmap.md#library-filters-and-search).

- **Progress is saved while you read:** on pause and at each move while paused, when you leave the reader, when the app goes to the background, and every 2 seconds while playing. Why: iOS can close a web app in the background without warning; 2 seconds leaves room within the 5 seconds the device check below allows for a write still in flight and a late timer.
- **Progress and time left** measure the reading flow (feature 2): 0% at its first word and 100% at the Finished card. A position in a skipped section counts as 0% before the flow and 100% after it, and inside the flow as the flow's next word: progress is the flow's words before it over the flow's words. Why: the simplest rule that keeps progress moving forward through a book.
- **Positions survive updates.** A position is stored by chapter, paragraph and word, so when a later version splits words differently, you land in the same paragraph. Why: the splitting rules will change as timing gets tuned. How it's stored: ADR 0008.
- **Finished books** show "Finished" in the library in place of progress and time left, and open on their Finished card (feature 7). Why: a book opens where you left off, and the card offers Start over.

Checks:

- E2E: the library shows the title, author, progress, time left and last opened date of each book, sorted by last opened.
- E2E: renaming one of your own books and deleting another both survive a reload.
- E2E: All is on at first and shows every book, Public only the built-in books and My books only your own; one chip is always on, and it stays on after reading a book.
- Unit: a saved position still points into the same paragraph after a change to the word-splitting rules (for example, splitting at em dashes).
- Device: after force-quitting the installed app mid-reading, the word marked in the reopened book is at most 5 seconds of reading behind where it stopped.

### 5. Single-word display

One word at a time, in the layout Spritz introduced in 2014 and open-source readers copy (OpenSpritz, [speedread](https://github.com/pasky/speedread), [SpritzerTextView](https://github.com/andrewgiang/SpritzerTextView), [Speeedy](https://github.com/sami-29/speeedy)). Why: it's the convention, and it rests on reading research: the eye recognises a word fastest when it lands a little left of the word's centre.

- **Focus letter by length.** Only letters and digits count, so quotes and other punctuation are skipped. The rows are speedread's ([`find_ORP`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L93-L98)), which counts punctuation too:

  | Letters | Focus letter |
  | ------- | ------------ |
  | 1       | 1st          |
  | 2–5     | 2nd          |
  | 6–9     | 3rd          |
  | 10–13   | 4th          |

  Words over 13 letters are split first (see Long words), so the convention's last row, the 5th letter for 14 letters or more, never applies.

- **Fixed spot.** Each word is placed so its focus letter lands on the same point every time, 40% of the way across the word area: left of centre, since most of a word sits to the right of its focus letter. Why: the eyes never have to move. 40% rather than the third that speedread comes close to (column 20 of 64, [`$ORPvisualpos` and `$cursorpos`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L59-L60)): in the first device trial, a third left 5- and 6-letter words wholly in the left half of the screen, and the owner preferred 40% (#36).
- **Look.** The focus letter is drawn in the highlight colour (red by default) and the rest of the word in the text colour. Thin lines run above and below the word area, each with a short tick at the focus point; Spritz calls this frame the "redicle".
- **Highlight settings.** The highlight can be turned off: the focus letter then takes the text colour, and nothing moves. A few highlight colours are offered, each readable on both the light and the dark theme. Why: some readers find the colour distracting, and colour-blind readers and dark mode need choices.
- **Long words.** A word longer than 13 letters is split at its own hyphens first (or at slashes and dots in a web address); only as many of those cuts are kept as needed, so neighbouring pieces rejoin while they fit in 13 letters ("twenty-seven-", then "year-old"). Any part still longer than 13 letters is then split into the fewest even parts of at most 13 letters. Every part but the last ends with a hyphen, unless it already ends in one of those marks, and every part gets its own focus letter. Why: the established approach; 13 letters is what fits. Like SpritzerTextView, Readalez cuts at a hyphen only while a part is still too long ([`Spritzer.java`](https://github.com/andrewgiang/SpritzerTextView/blob/8c5dd53843a6d6525d7faa7a4be9b69ee294142e/lib/src/main/java/com/andrewgiang/textspritzer/lib/Spritzer.java#L213-L268)), which gives fewer, fuller flashes than cutting at every hyphen as speedread does ([`split`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L197)).
- **Words.** Text between spaces is a word, with its punctuation attached. Hyphenated words stay whole ("well-known"); words joined by a dash without spaces are split ("yes—no" shows "yes—", then "no"); numbers stay whole ("1,000.50"). Gutenberg's `--` counts as a dash, and so do `―`, `⸺` and `⸻`; an en dash (`–`) doesn't split, so ranges such as "1914–1918" stay whole. A dash splits only where both sides have a letter or digit. A piece with no letters or digits isn't shown on its own: a spaced dash or ellipsis joins the word before it as its punctuation, keeping its space ("paused —"), and a line of only symbols (such as `* * *`) is a scene break that counts as a paragraph end. Opening quotes and brackets, `¿` and `¡`, and a symbol with no word before it (a dialogue dash at the start of a paragraph) join the word after them instead ("« Bonjour »", "— Привет,"). The exception is `&`, which shows as a word. Why: the space keeps the text as written, and an opening mark belongs to the word it opens, as in French, Spanish and Russian dialogue.
- **Accents and scripts.** A letter with accents counts and highlights as one letter, however it's encoded. Greek and Cyrillic words follow the same rules.
- **Text size** goes up to the largest size at which a 13-letter word such as "comprehension" still fits on a 375-px-wide screen (iPhone SE) in portrait. A word that still doesn't fit, such as one in wide capitals, shrinks to fit while it shows and is never clipped. Which screen the largest size must fit is open ([Open questions](#open-questions)).

Checks:

- Unit: the focus letter of words with 1–13 letters follows the table, ignoring leading and trailing punctuation (`"Hello,` highlights the `e`).
- Unit: `é` written as one character and as `e` plus a combining accent both highlight as one letter; Greek and Cyrillic words follow the table.
- Unit: `incomprehensibilities` (21 letters) splits into two parts with a hyphen; `Constantinople-born` splits at its hyphen, then its 14-letter first part splits again; a long web address splits at slashes.
- Unit: `well-known` and `1,000.50` are one word each; `yes—no` and `yes--no` are two; a spaced `—` joins the word before it; `* * *` makes a paragraph end.
- E2E: across 50 consecutive words, the centre of the focus letter stays at the same horizontal position (within 1 px) at the smallest and the largest text size, in both themes, and the ticks line up with it.
- E2E: with the highlight off, the focus letter has the text colour and stays in place.
- E2E: each highlight colour has a contrast ratio of at least 3:1 against the background in both themes.
- E2E: at the largest text size in a 375-px-wide viewport, `WWWWWWWWWWWWW,”` shows whole, shrunk to fit.
- Device: on iPhone in portrait at the largest text size, "comprehension" fits on screen.

### 6. Timing

- **Speed:** 100–1,000 words per minute, in steps of 10, starting at 300. One speed applies to all books, as the simplest. Why this range: it's the common one in speed-reading apps. Above about 1,000 wpm a word gets fewer than 4 screen refreshes, and iPhone's Low Power Mode halves the refresh rate for web pages, so timing turns uneven.
- **What the number means:** the base speed. An ordinary word shows for 60,000 ÷ wpm milliseconds (200 ms at 300 wpm), and pauses come on top, so the real average runs below the setting. Why: the convention (OpenSpritz, speedread, Speeedy), and time left uses the same rules, apart from [the pause after play](docs/known-issues.md#time-left-leaves-out-the-pause-after-play).
- **Starting values,** to be tuned on the owner's iPhone with the tuning screen (feature 11):

  | A word that…                                                       | Shows for     |
  | ------------------------------------------------------------------ | ------------- |
  | is ordinary                                                        | 1×            |
  | has 8 or more letters                                              | 1.3×          |
  | ends with `,` `;` `:` a dash or a closing bracket                  | 1.5×          |
  | ends a line of verse                                               | 2×            |
  | ends a sentence (`.` `!` `?` `…`, also when closing quotes follow) | 2×            |
  | ends a paragraph or a heading, or comes right before a heading     | 5×            |
  | is the first after you press play or jump                          | at least 1.5× |

  Of the punctuation rows, only the largest applies; the long-word factor multiplies it, so a long word ending a sentence gets 2.6×. The first word after play or a jump shows for the larger of 1.5× and its usual time. Each part of a split word is timed by its own length, with punctuation pauses on the last part; the hyphen added at a split isn't a dash. Why: these follow the open-source Spritz-style readers, nearest to Speeedy (2× for sentence ends and 1.4× for commas, scaled by its sentence-pause setting, plus a paragraph pause: [`getPauseMultiplier`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L615-L643) and [where it's scaled](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L420-L427)); speedread uses 2× for commas and 3× for full stops ([`$commatime` and `$fstoptime`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L53-L54)). In the first device trial on the iPhone (#36), with 3× sentence ends, 4× paragraph ends and a 3× start, a sentence end felt like a stop at every sentence, a paragraph end felt no different, and the start looked broken, since the word is already on screen while paused. So sentence ends come down, paragraph ends go up to leave a clear break to blink, and the start pause is shorter. Timing still gets tuned by feel on a device.

- **Abbreviations.** Titles, initials ("J. R. R.") and abbreviations that rarely end a sentence ("Mr.", "Dr.", "e.g.", "i.e.", French "M.", German "z. B.", Polish "np." and so on) get no sentence pause unless they end a paragraph, and neither do decimals ("3.14"). Abbreviations that often end a sentence ("etc.", "U.S.", Polish "r." after a year) end one when the next word starts with a capital letter. Why: the convention of sentence splitters such as pySBD and NLTK's Punkt, in its simplest form. Pausing at every "etc." or never pausing at one both read wrong. Known gaps: docs/known-issues.md.
- **Languages.** English, plus European languages written in Latin, Greek or Cyrillic script. Their quote marks and punctuation (« », „ “, ‹ ›, ¿ ¡) count as punctuation, not letters, and after a Greek word `;` is a question mark that ends the sentence. Rules are tuned on English first. Why: the owner cares about a few European languages, and this group was the option offered instead of English only (#44).
- **Chapter titles** show as words, with the paragraph pause around them, and reading flows on into the next chapter without stopping.
- **No drift, no skipped words.** Words follow a fixed schedule, so small timer delays don't add up. If the device falls behind (in Low Power Mode, for example), reading slows down rather than skipping words: every word is on screen for at least one refresh.
- **Speed changes** take effect from the next word.
- **Time left** for the chapter and the book is computed from the same rules at the current speed.

Checks:

- Unit: at 300 wpm, every word of a fixed passage gets exactly the duration in the table (the passage has commas, sentence ends, a paragraph end, a heading, a line of verse and long words).
- Unit: titles, initials and decimals get no sentence pause, abbreviations such as "etc." end a sentence only before a capital letter, and sample sentences in English, French, German, Spanish, Polish, Russian and Greek get the right pauses.
- Unit: with a fake clock, 1,000 words at 1,000 wpm finish within 1% of their computed total; with frames arriving only every 33 ms (30 Hz) and one 250 ms stall, every word still shows, in order, with none skipped.
- Unit: time left equals the sum of the remaining words' durations.
- Device: at 300 and at 600 wpm on iPhone, a chapter takes the time left shown at its start, within 2% by stopwatch.

### 7. Reader

- **Controls.** Tap the word frame to play or pause. Below it, two rows of buttons: slower and faster (10 wpm each) around the current speed, and back and forward a sentence around the word "sentence". Holding slower or faster keeps changing the speed until you let go. Back goes to the first word of the sentence on screen, or to the first word of the sentence before when that word is already on screen. On desktop, Space plays or pauses, ← and → move by a sentence, and ↑ and ↓ change the speed. Why: one big tap target suits a phone. The speed and sentence buttons sit in separate rows, and holding keeps stepping (the owner's choices, reviewing #59). Back stops at the sentence's own start first, since jumping a whole sentence back from mid-sentence looked odd once a word can be picked in the paused view (the owner, reviewing #68).
- **Resume where you left off.** Pressing play after a pause, or in a book just opened, starts at the word on screen. Why: the paused view shows the sentence around the word and lets you tap any word to start from, so going back to the sentence start only got in the way (the owner, reviewing #68).
- **Paused view.** When paused, the current word stays in its frame, and the text around it appears below, scrollable through the chapter, with the current word marked. Tapping a word in the text moves the frame to that word, and play then starts exactly there. A tap only moves; play stays with the frame and Space. Why: it helps you recover a lost thread, and the later paragraph pacer can build on it. A second tap on the word doesn't play, as it does in [some other readers](docs/roadmap.md#reader-layout-options): the owner preferred it this way (reviewing #68).
- **Navigation.** A chapter list, behind a Chapters button beside Back, including the skipped front matter, the notes and the publishing pages, which are marked "skipped"; the entry you're in is highlighted, and tapping an entry jumps to its start, paused. A part the book's table of contents doesn't list gets an entry titled with its first paragraph, cut as a pasted title is (feature 1), so everything skipped can be reached. A draggable progress bar covers the reading flow, and letting go moves to the start of the nearest sentence. Time left shows for the chapter and the book, in minutes and seconds (`h:mm:ss` from an hour). The bar stays on screen while playing, dimmed and locked, so it can be dragged only while paused; time left shows only while paused. Why: seconds, because [feature 6's device check](#6-timing) compares a chapter's time left with a stopwatch to within 2%; hidden while playing, because the times took too much attention from the words (the owner, reviewing #68); the bar locked while playing, because a drag then moved the place mid-reading (the owner, testing #75).
- **What a chapter is,** for the paused view and chapter time left: from one chapter-list entry to the next, at any depth, so the deepest entry wins; a part of the reading flow also starts one, so a chapter is wholly in or out of the flow. Before the first entry, a chapter runs from the start of the book; with no chapter list (pasted text), the whole text is one chapter. A chapter can span the book's files. Why: KOReader's rule ([readertoc.lua](https://github.com/koreader/koreader/blob/a3ebf281fc19483173b48e71b39ee5e949833385/frontend/apps/reader/modules/readertoc.lua#L598-L608), research in #15), since a file can hold many chapters: Gutenberg's _Moby Dick_ has 135 chapters in 11 ([fixtures](tests/fixtures/epub/README.md)).
- **Finished card.** After the reading flow's last word, a card shows the book's word count (of the flow, so without the license or notes), your total reading time for it and your real average speed, and the book is marked finished. The card offers Back to library and Start over; Start over goes back to the flow's first word, paused, and the book is no longer marked finished. The keys do nothing while the card shows. The word count counts runs of text between spaces, so "yes—no" is one word. Why: the simplest count; it doesn't need to match the words shown exactly (the owner, reviewing #68).
- **Pausing by itself.** Reading pauses when the app goes to the background, the screen locks or the tab is hidden, and it never resumes on its own.
- **Screen awake.** The screen stays on while words are playing, and can lock as usual once paused.

Checks:

- E2E: tapping the word frame and pressing Space each toggle between playing and paused, including from the paused view.
- E2E: after pausing mid-sentence, pressing play shows the word on screen first.
- E2E: the back button and ← move to the start of the sentence on screen, or of the one before from a sentence's first word; the forward button and → move to the next sentence start; the speed buttons and ↑ and ↓ change the speed by 10, within 100–1,000.
- E2E: the paused view marks the current word; after tapping another word in the text, the frame shows that word and play starts at it.
- E2E: the chapter list shows the front matter, chapters, notes and publishing pages, and tapping one jumps to its start.
- E2E: dragging the progress bar to the middle lands on a sentence start near the middle of the reading flow; while playing, the bar is dimmed and a drag doesn't move it.
- E2E: hiding the page pauses reading.
- E2E: reading the last word shows the Finished card with the word count, reading time and average speed, and the library shows the book as finished.
- Device: in the installed app on iPhone, with Auto-Lock at 30 seconds, two minutes of playing keep the screen on, and after pausing it locks as usual.
- Device: switching to another app while reading pauses it, and the reader is still paused on return.

### 8. Settings

Speed, highlight on or off, highlight colour, theme (follows the system, or light, or dark), text size, Export backup and Import backup (feature 9), Delete all data, and About (feature 13).

- **Delete all data** asks for confirmation, then removes your own books, progress, settings and reading sessions. The built-in books stay, at 0%.

Checks:

- E2E: every setting survives a reload.
- E2E: the theme follows the system until it's set to light or dark.
- E2E: after Delete all data, the library holds only the built-in books, at 0%, the settings are back to their defaults and no sessions remain.

### 9. Backup file

- **Export** writes one file with the text of your own books, the progress of every book, your settings and your reading sessions. On iPhone it can be saved to Files.
- **Import** reads a backup and merges it into this device. Books missing here are added; for a book on both, the position from whichever device read it last wins; sessions are combined without duplicates. Why: it works as a manual sync between iPhone and desktop.
- **Settings** from a backup replace this device's only when the device has no reading yet. Why: text size and theme often differ between a phone and a desktop.
- **Books match across devices** by their text, so the same edition imported on two devices counts as one book.
- **Bad files.** A file that isn't a Readalez backup, or comes from a newer version, shows a clear message and changes nothing. Backups carry a format version, so later versions can read older backups.

Checks:

- Unit: a device with book A at 40% (last read on Monday) imports a backup with A at 60% (read on Tuesday) and book B; afterwards A is at 60% and B is in the library.
- Unit: importing the same backup a second time changes nothing.
- Unit: a device with no reading takes the backup's settings; a device with reading keeps its own.
- Unit: an invalid file, and one with a newer format version, are rejected with nothing changed.
- E2E: exporting, then importing into a fresh browser profile, restores the books, positions, settings and sessions.
- Device: export in the installed iPhone app saves the file to Files, and importing that file in desktop Chrome merges as above.

### 10. Reading sessions

Each reading session is recorded on the device: when it started, the book, the words read, the playing time and the real average speed. A session starts with play and ends when the book is closed, when the app goes to the background or after 5 minutes paused. Paused time doesn't count, and words read are the words shown while playing, re-reads included. In v1 sessions show only on the Finished card. They go into backups, Delete all data removes them, and deleting a book keeps its sessions. Why: stats come after v1, and this way they start with a history. A 5-minute break ends a sitting, and counting only playing time keeps the average speed honest.

Checks:

- Unit: playing for 2 minutes, pausing for 1 and playing for 1 more makes one session with 3 minutes of playing time; a pause of over 5 minutes splits it into two.
- Unit: the words read and the average speed are right for a session that includes a jump back.
- E2E: after reading a few paragraphs, a session is stored for that book with the right word count.

### 11. Tuning screen

Reached through Settings, About, Tuning, rather than from the main settings. It has a slider for every value in the timing table (feature 6) and for the long-word threshold, and it plays a passage from a built-in book at the current speed with the current values. Copy values puts them on the clipboard as text to paste into an issue; Reset brings back the defaults. The values apply on this device only, until a PR makes them the defaults. Why: timing feels robotic until it's tuned by feel, so the owner tunes on the iPhone and a PR records the result.

Checks:

- E2E: moving a slider changes the durations of the sample's words.
- E2E: Copy values puts every value on the clipboard, and Reset restores the defaults.
- Unit: tests pin the default values; a PR that changes them also updates the table in feature 6.

### 12. Install, offline and updates

- **Install.** Add to Home Screen in iPhone Safari, Chrome's install option on Android (where Chrome shows it: not checked), or the install button in desktop Chrome and Edge gives a full-screen app named Readalez with its own icon. Firefox runs it in a tab.
- **Offline.** After the first visit, the app, the built-in books and your own books work without a network. While the built-in books download in the background, a band at the top of the library shows how many are saved and asks to stay online; it then says "Ready to use offline." for the rest of the visit, and shows nothing on later visits. It says so if saving fails, with a reload to try again. Why: the books are most of the download (feature 3), and nothing showed when they were saved: on one iPhone test, going offline too early left a built-in book that didn't open ([#98](https://github.com/Antananariwa/readalez/pull/98#issuecomment-6863828631)).
- **Updates** download in the background and apply at a later launch, never while you read.
- **Install tip.** On the first visit in iPhone Safari (not in the installed app), a card explains that Safari and the installed app keep separate libraries, and that Safari deletes a site's script-writable storage after seven days of Safari use without interaction with the site ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)); it shows the Add to Home Screen steps. Once dismissed, it doesn't return. Why: books added in a Safari tab don't appear in the installed app, and the seven-day cap "does not apply to installed PWAs that have been added to the home screen" (web.dev's _Storage for the web_, 2020, updated 2022, citing the WebKit post above: [`storage-for-the-web/index.md`](https://github.com/GoogleChrome/web.dev/blob/caed76fd1c6ad132fcc9e42445645baed583f35f/src/site/content/en/blog/storage-for-the-web/index.md?plain=1#L254-L261)).
- **Keep the data.** The app asks the browser for persistent storage; when it asks is #22's choice. Why: a browser that grants it doesn't clear the data to free space.

Checks:

- E2E: after one visit, the app reloads with the network off, and a built-in book plays.
- E2E: a first visit shows the books saving, then "Ready to use offline."; a later visit shows neither; a book that fails to download shows that saving failed, and a worker script that arrives late still ends in "Ready to use offline."
- E2E: a new version deployed while a book is playing doesn't reload the page, and a later launch runs it.
- E2E: the install tip shows once in emulated iPhone Safari (not installed) and never in other browsers.
- E2E: once one of your own books is saved, the app has requested persistent storage.
- Device: Add to Home Screen on iPhone gives a Readalez icon that opens full screen, and in Airplane Mode the library and reading still work.

### 13. About, privacy and licenses

About shows the version, a link to the source code and its MIT license, the privacy note, the credits (Standard Ebooks for the built-in editions, and Speeedy for any code taken from it), the third-party licenses, and the way into the tuning screen.

- **Privacy note.** Readalez has no accounts, analytics, cookies, ads or server of its own. Your books, progress, settings and reading sessions stay on this device unless you export a backup. The web host that serves the app's files handles requests as it does for any website; Readalez adds no logging.
- **No requests to other sites.** Fonts are the system's, nothing loads from CDNs, and the only outside links are ones you tap: the source code link in About and the help links in [feature 14](#14-where-to-find-books).
- **Licenses.** Every dependency bundled into the app is listed with its license text and any NOTICE file, generated at build time. Allowed licenses: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0 and CC0-1.0. Anything else fails the build. Why: so Readalez can stay MIT with every notice shipped.

Checks:

- E2E: a full session (open, paste, import, read, export) makes requests only to the app's own origin.
- E2E: About lists every bundled dependency with its license.
- Build: a bundled dependency whose license isn't on the allowed list fails the build.
- Review: code copied or adapted from Speeedy keeps Speeedy's MIT copyright notice at the top of its file and is named in the credits.

### 14. Where to find books

A short help note on the Add text screen. It links to Project Gutenberg and Standard Ebooks and gives the steps: on iPhone, download the EPUB in Safari (it lands in Files, under Downloads), then Add text, Import EPUB; on Android, download the EPUB in Chrome, then Add text, Import EPUB (where the file lands and how the file picker shows it: not checked); on desktop, download, then import. It adds that copyright laws differ between countries and asks readers to check their local laws before reading a book, since Readalez itself doesn't check a book's copyright ([known issue](docs/known-issues.md#readalez-doesnt-check-whether-a-book-is-free-to-read-where-you-live)). Why: there's no catalog in v1, so readers need the way to free books.

Checks:

- E2E: the links go to gutenberg.org and standardebooks.org and open in a new tab.
- Device: following the iPhone steps with a Standard Ebooks book ends with the book in the installed app's library, marked New.

## Out of scope for v1

Ideas for after v1, from the paragraph pacer to stats and more formats, live in [docs/roadmap.md](docs/roadmap.md), grouped by area. These are left out for other reasons:

- **Importing from a web link:** not planned. It needs a server that fetches any page, which invites abuse and copyright trouble.
- **Sync and accounts:** not planned. They need a server holding personal data, which brings in UK GDPR, and the backup file covers moving between devices.
- **Accessibility conformance** (WCAG): not a v1 goal. Why: too much work for v1 (#44).
- **Right-to-left texts and Chinese, Japanese or Korean texts:** they need a mirrored layout or a different way of splitting words, which is much more work. Interface languages other than English are out too.
- **Removing or replacing the built-in books.**

## Legal and licensing

Working assumptions from public sources, not legal advice. Recheck them before anything that changes the risk: charging money, or adding a server or a catalog.

- **Copyright.** Everything Readalez ships (the built-in books, test fixtures and sample passages) is copyright-free, such as the public-domain books Project Gutenberg and Standard Ebooks offer. Why: a fixed number of years since the author's death ruled out ordinary public-domain books (the owner, testing #14). Books readers import stay on their devices and are never uploaded, so the app distributes nothing else.
  - **Built-in books** are public domain in the US and in the UK: every author and translator died before 1956, which `scripts/build-books.ts` checks against each one's death year. Why: Standard Ebooks says its books "may still be copyrighted in other countries" (each book's `dc:rights`). In the UK, copyright "expires at the end of the period of 70 years from the end of the calendar year in which the author dies" ([Copyright, Designs and Patents Act 1988, section 12(2)](https://www.legislation.gov.uk/ukpga/1988/48/section/12)), so a death in 1955 or earlier means public domain from 2026. Translators count as authors here, to be safe: whether the UK treats a translation that way is not checked. For example, Standard Ebooks' _Art of War_ is out: its translator Lionel Giles died in 1958 ([Wikidata](https://www.wikidata.org/wiki/Q59188)).
- **Project Gutenberg.** Its name stays out of the app's name. In v1 the app only links to Gutenberg and leaves Gutenberg's license pages out of the reading flow of books readers import for themselves (feature 2). A text that keeps the Project Gutenberg name must carry its license, while one stripped of every Gutenberg mention is a plain public-domain text (not checked), so the Gutenberg test fixtures keep their license pages. A later catalog has more of Gutenberg's rules to respect: [docs/roadmap.md](docs/roadmap.md#public-domain-catalog-and-proxy).
- **Focus-point patents.** The fixed focus point in feature 5 is what Spritz's patents describe: US 8,903,174 ("Serial text display for optimal recognition apparatus and method", filed 2012; Google Patents lists it as active, which isn't verified), the related US 9,483,109 and US 10,332,313, and a European family member (validated in Spain as ES 2700224 T3, so UK coverage is possible). The Chinese and Japanese members have lapsed. Free apps use the design openly (the open-source readers in [feature 5](#5-single-word-display)), and the risk is low for a free open-source app. Recheck before charging money, and keep "Spritz" out of the name and the app's text.
- **Name.** See [What Readalez is](#what-readalez-is).
- **Privacy.** With no accounts, analytics, cookies, ads, logging or server of its own, Readalez collects no personal data. Storage on the device holds only what the features a reader uses need, which the UK's rules on device storage (PECR) treat as strictly necessary, so no consent banner is needed. Adding a server, sync or analytics means revisiting UK GDPR first.
- **Licenses.** Readalez is MIT. Dependencies stay permissive, and their notices ship in the app (feature 13). Code copied or adapted from Speeedy (`sami-29/speeedy`, MIT) keeps its copyright notice. Its test fixtures are never copied: one of them is a copyrighted book ([`test-fixtures/01-11-2020-212827The 7 Habits of Highly Effective People.pdf`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/test-fixtures/01-11-2020-212827The%207%20Habits%20of%20Highly%20Effective%20People.pdf)). The Standard Ebooks editions are credited as a courtesy; their license is under [Built-in books](#3-built-in-books).

## How features are checked

- **Unit:** unit tests run by `npm run check`, mostly in `src/core`, where reading rules are tested exactly and quickly (ADR 0003). The Stop hook runs them.
- **E2E:** Playwright in the dev container, in headless Chromium, in WebKit with iPhone emulation, and in Chromium with Android phone emulation, including screenshots and measurements. Why WebKit, and why the Device checks stay: ADR 0005. Why the Android emulation: [ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md).
- **Build:** a check that runs as part of the build.
- **Review:** checked by reading the diff. Each merged PR's review is collected in [docs/reviews.md](docs/reviews.md), to show what the reviews catch.
- **Device:** the owner on the iPhone (installed app, iOS 18.4 or later) and in desktop Chrome, Edge and Firefox; Android has no device checks (see [Devices and browsers](#devices-and-browsers)). Each PR's How to test lists them.
- **Test fixtures** follow the copyright rule in [Legal and licensing](#legal-and-licensing).

## Dependencies between issues

Each open issue names the issues it builds on. A check that needs a later feature moves to that feature's issue: for example, feature 7's chapter-list check lands with feature 2's reading flow (#15).

## Open questions

- **Final timing values:** set after tuning on the iPhone (feature 11). The table in feature 6 holds starting values.
- **Speed and size targets:** which ones v1 sets, and at what values. #73 researches them near the end of v1 (the owner, reviewing #72).
- **App icon and visual style:** not decided, apart from no Warner Bros. references.
- **Narrowest screen for the largest text size.** Feature 5 sizes it for a 375-px-wide screen (iPhone SE), with no recorded reason: the rule came in with the first SPEC.md (#3), and #48, which rewrote an e2e comment's "on an iPhone SE" as "in this 375 × 667 viewport" (`e2e/reader.spec.ts`), noted this rule as the same claim. In `@playwright/test` 1.64.1's device presets, `iPhone SE (3rd gen)` is 375 × 667 and is the narrowest with an iOS 18 user agent; `iPhone SE` is 320 × 568, with an iOS 10.3.1 user agent. Which iPhones run iOS 18.4 the presets don't show. Android emulation runs at 360 px ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)), where today's fixed word size (`--word-size: 2.25rem`, 36 px, in `src/ui/styles.css`) fits "comprehension" with about 8 px to spare in the container's Chromium, measured on Playwright screenshots by a script not in the repo; Android's own fonts may differ (not checked) ([#87](https://github.com/Antananariwa/readalez/pull/87)).
