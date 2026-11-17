# Spec

What Readalez does and why. It is corrected as Readalez meets real books, devices and readers.

Each feature has a number and a heading. Under it, each rule is an item, in OpenFastTrace's shape ([ADR 0016](docs/adr/0016-write-spec-md-as-openfasttrace-items.md)):

- A title, then what the app does.
- Then `Rationale:`, where the reason isn't obvious.

Tests and issues cite a feature by its number. The [Glossary](#glossary) defines the terms. The technical choices are in [docs/adr](docs/adr/).

## What Readalez is

A free, open-source speed-reading web app for practising on real, meaningful texts. v1 shows one word at a time with a highlighted focus letter. It is a PWA (ADR 0002), so it installs from the browser on iPhone, Android and desktop.

### Public

Anyone with the link can use it. Privacy, copyright and polish are judged for strangers.

Rationale: It is a portfolio piece.

### Free and open source

Readalez is MIT-licensed.

Rationale: A public portfolio piece is open to read. Being free also keeps the patent risk low ([Legal and licensing](#legal-and-licensing)).

### Name

Readalez, a nod to Speedy Gonzales. The nod stays in the name only. Neither the icon nor the app's text carries the Warner Bros. character or a reference to him.

Rationale: The name is short, and no other GitHub repository uses it (`gh search repos readalez`). Keeping the character out keeps clear of the trademark. It also keeps clear of the criticism of the character as "an offensive Mexican stereotype" ([Wikipedia](https://en.wikipedia.org/wiki/Speedy_Gonzales)).

## Principles

These apply to every feature.

### Everything stays on the device

No accounts, no server of our own, no analytics, no cookies, no ads. Texts, progress, settings and reading sessions live in the browser's storage. A backup file moves them between devices.

Rationale: This gives privacy without paperwork ([Legal and licensing](#legal-and-licensing)). There is no server to run or pay for ([ADR 0006](docs/adr/0006-host-on-cloudflare-pages.md)), and the app works offline.

### Established designs, simplest version first

Where speed-reading apps share a convention, Readalez follows it, and a departure needs a reason. Each feature starts as the simplest version that works.

Rationale: A proven convention needs less tuning than a new design.

## Devices and browsers

### iPhone

iOS 18.4 and later, in the installed app and in Safari.

Rationale: 18.4 is the first version where an installed web app can keep the screen awake. MDN's compatibility data lists the Screen Wake Lock API in Home Screen web apps from 18.4 ([`api/WakeLock.json`](https://github.com/mdn/browser-compat-data/blob/8d371e9fb68c0cdc1908fa370358f6659aaec513/api/WakeLock.json#L26-L36)). On earlier versions, the screen dims and locks mid-chapter.

### Android

Current Chrome, in the installed app and in a tab. It is checked by emulation, with no device checks ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md), [known issue](docs/known-issues.md#android-is-checked-only-by-emulation)).

Rationale: Android had 72% of mobile web use worldwide in October 2026 ([StatCounter](https://gs.statcounter.com/os-market-share/mobile/worldwide)), so a public app gets opened on Android phones.

### Desktop

Current Chrome, Edge and Firefox. Chrome and Edge can install the app. Firefox runs it in a tab.

Rationale: Together they had 86% of desktop browser use worldwide in October 2026 ([StatCounter](https://gs.statcounter.com/browser-market-share/desktop/worldwide)).

### Not checked

Safari on Mac and iPad are not checked in v1.

Rationale: Every checked browser adds a manual check per release.

### Orientation and language

Portrait and landscape both work. The interface is in English.

## v1 features

### 1. Add text by pasting

A paste box on the Add text screen. Saving adds the text to the library and opens it at the first word.

Rationale: Pasting is the quickest way in for articles and snippets. On iPhone, Safari's Reader view gives clean text to copy.

#### Paragraphs

Blank lines separate paragraphs. Text can be hard-wrapped, with most lines breaking mid-sentence at similar lengths. There, single line breaks are joined with spaces. Otherwise, each line is its own paragraph.

Rationale: Text copied from Safari's Reader view has one paragraph per line. Gutenberg's plain text wraps about every 70 characters. Both should read as written.

#### Gutenberg license text

If the text contains Gutenberg's `*** START OF` and `*** END OF` lines, only the part between them is kept.

Rationale: Reading starts at the first real word, as with EPUBs.

#### Title

The title is the first line of the text kept, cut at a word boundary to at most 60 characters. It can be edited before saving, and later in the library. A title left blank saves as the first line.

Rationale: The title should name what you read, and the library needs one for every text.

#### Author

A pasted text's author is **Unknown author**, as for an EPUB with none (feature 2).

Rationale: One rule for every book, with no extra field to fill in.

#### Same text twice

Saving a text already in the library adds nothing, and says so. It offers to open the copy already there, with its title and progress, or to cancel. Texts match by their words (ADR 0007).

Rationale: One book, one entry.

#### No chapters, no verse

Pasted text is one section, with no chapters and no verse lines. A pasted poem follows the paragraph rules above.

Rationale: Books come in as EPUB, which marks chapters and verse. Other formats are ideas for after v1 ([roadmap](docs/roadmap.md#txt-pdf-word-and-other-formats)).

### 2. Import EPUB files

Importing an EPUB on the Add text screen opens the file picker. The book is read on the device and added to the library with a New mark.

Rationale: Project Gutenberg, Standard Ebooks and Wikisource all offer EPUB, and it marks chapters and paragraphs.

#### Supported

EPUB 2 and 3 without DRM. The reading order is the book's spine. The chapter list comes from the book's table of contents, or from its headings if it has none.

#### Where reading starts

The first time a book opens, reading starts where the author's text starts. Publishing paperwork stays out of the reading flow:

- the cover, title and half-title pages;
- copyright and imprint pages;
- contents pages and lists of illustrations;
- pages left empty once images are dropped;
- Gutenberg's license pages.

Everything the author wrote stays in, from dedications, epigraphs and prefaces to afterwords and appendices.

#### Reading flow

The reading flow runs from the author's first part to the last. It skips the paperwork between them, and reading jumps over a skipped part without stopping. The flow ends with the author's last words, where the Finished card shows (feature 7). Back-matter paperwork comes after it.

Rationale: Some books place paperwork between the author's parts, such as a list of illustrations after the preface.

#### Skipped parts

Every skipped part stays reachable from the chapter list. Playing a skipped part reads it to its end and stops there.

#### Notes

Note markers, such as ¹, [12] and \*, never show as words. The notes are gathered, in book order, into one notes section after the book, outside the reading flow. The section has its own entry in the chapter list, and links into a note lead there.

Rationale: A marker flashing as its own word breaks the flow, and one entry reaches every note. Each book's sections keep their places (ADR 0011).

#### Kept and dropped

Headings, paragraphs, block quotes, list items and table rows each read as a paragraph. Each line of verse ends with a pause (feature 6). Images are dropped, with their alt text and captions. Soft hyphens and zero-width characters are removed, and non-breaking spaces read as spaces.

Rationale: Alt text and captions describe pictures that aren't shown.

#### Title and author

From the book's metadata, falling back to the file name and **Unknown author**.

#### Copy-protected books

A copy-protected book shows a message saying so, and isn't added. A book is copy-protected when a file Readalez reads is encrypted with anything other than font obfuscation. A book whose only scrambled files are fonts opens.

Rationale: Font obfuscation scrambles fonts for licensing, and Readalez never reads fonts. A locked file Readalez doesn't read, such as an image, doesn't stop reading. Kindle formats are an idea for after v1 ([roadmap](docs/roadmap.md#kindle-formats-mobi-azw-kfx)).

#### Errors

A file that isn't a readable EPUB shows an error, and so does one with a damaged file that Readalez reads. Nothing half-imported reaches the library. Damaged images, styles and fonts go unnoticed, since Readalez never reads them.

#### Import progress

While a book is read, a progress bar shows on the Add text screen, and the screen's buttons are disabled. The page can be slow to respond meanwhile ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)).

Rationale: A bar on the page needs less code than importing in the background, and nothing else on the page is needed during an import.

#### New mark

A book just imported shows in the library with a New mark. The mark stays until you open a book, go to the Add text screen or reload.

Rationale: After an import you land in the library, not in the book, so the mark shows which book arrived. Pasted text opens at once instead (feature 1), since a paste is usually read straight away.

#### Same book twice

Importing a book whose text is already in the library adds nothing. It says so, with how far you've read it, and offers to open that copy where you left off, or to cancel. A different edition is a different book.

Rationale: You are told, rather than dropped into a book without warning, and your progress stays.

### 3. Built-in books

Twenty-four free books are in the library from the first visit, under the built-in books' library filter (feature 4).

Rationale: A new reader can try the app at once, with no import first, and pick something they like. The books also serve for tuning and as test fixtures. Two dozen gives a real choice without making the app noticeably slower or heavier.

#### Which books

- English prose: novels, novellas, stories and a little non-fiction.
- A spread of genres: adventure, mystery, science fiction, horror, humour, children's classics and philosophy.
- A spread of lengths, from under 2 hours at 300 wpm to over 10.
- No plays, poetry collections, or collections of hundreds of thousands of words.
- Each is public domain in the US and in the UK ([Legal and licensing](#legal-and-licensing)).

Rationale: The books should suit reading word by word and a first try at the app. Plays read badly one word at a time (#79).

#### Editions

Standard Ebooks' editions, without their pictures. Each book's metadata gives its one-line summary.

Rationale: They are proofread, cleanly marked-up EPUB 3. Their contributors dedicate their own work to the public domain under CC0 ([_A Christmas Carol_'s Uncopyright page](https://github.com/standardebooks/charles-dickens_a-christmas-carol/blob/fbcca8acb37169bbb560b8796c1f05b0240f6792/src/epub/text/uncopyright.xhtml)), so there is no license text to carry.

#### Permanent

Built-in books can't be deleted or renamed. The own books' library filter hides them. Their progress works like any book's, and deleting all data resets it.

Rationale: There is always something to read and to tune with.

#### First open

A built-in book goes through the same import as the reader's own EPUBs, the first time it opens. A progress bar shows on its row in the library meanwhile. Until then, the library lists it at 0%, with its time left.

Rationale: Importing all of them on the first visit would keep the page busy for a long time ([known issue](docs/known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened), [ADR 0013](docs/adr/0013-ship-built-in-books-as-precached-epubs.md)).

#### Offline

The built-in books download with the app, about 4.2 MB, and work offline after the first visit.

Rationale: Every book then works offline once the app has loaded, as feature 12 promises, at the cost of a first download about 13 times the app's own.

#### Backups

A backup holds the built-in books' progress, not their text.

### 4. Library

The app's home screen. It lists every book, built-in or your own, most recently opened first and unopened books last. Each book shows:

- its title and author;
- its progress;
- its time left at the current speed;
- when it was last opened.

A built-in book also shows its one-line summary. Tapping a book opens it where you left off (feature 7). Your own books can be renamed and deleted, with a confirmation.

#### Library filters

Three library filters choose which books the list shows: all of them, only the built-in books, or only your own. They show as chips under the title, labelled **All**, **Public** and **My books**. One is always on, all books at first. The filter stays on while you read a book and come back. A reload goes back to all books.

Rationale: Other reading apps, such as Google Play Books and Kindle, filter a library by where its books come from (not checked: their help pages were read only through search results). Three choices with one always on show plainly what the list holds. **Public** says the books are free for anyone, as public-domain books are, without naming a genre, so a book that isn't a classic fits too. Keeping the filter across reloads waits for stored settings (#18). Filters by genre or author, and search, are ideas for after v1 ([roadmap](docs/roadmap.md#library-filters-and-search)).

#### Saving progress

Progress is saved:

- on pause, and at each move while paused;
- when you leave the reader;
- when the app goes to the background;
- every 2 seconds while playing.

Rationale: An app in the background can be closed without warning. A reopened book should then be at most 5 seconds of reading behind where it stopped. Saving every 2 seconds leaves room within those 5 seconds for a write in flight and a late timer.

#### Progress and time left

Progress and time left measure the reading flow (feature 2): 0% at its first word and 100% at the Finished card. Progress is the flow's words before the position, over the flow's words. A position in a skipped part counts as 0% before the flow, as 100% after it, and inside the flow as the flow's next word.

Rationale: The simplest rule that keeps progress moving forward through a book.

#### Positions survive updates

A position is stored by section, paragraph and word. When a later version splits words differently, you land in the same paragraph ([ADR 0008](docs/adr/0008-store-reading-positions-with-the-book.md)).

Rationale: The splitting rules will change as timing gets tuned.

#### Finished books

A finished book shows as finished in the library, in place of progress and time left. It opens on its Finished card (feature 7).

### 5. Single-word display

One word at a time. The focus letter of each word is highlighted, and lands on the same spot every time.

Rationale: This is the layout Spritz introduced in 2014, which open-source readers such as [speedread](https://github.com/pasky/speedread) copy. A reader's eyes land "between the beginning and middle of the word" ([The Conversation, 2014](https://theconversation.com/spritz-and-other-speed-reading-apps-prose-and-cons-24467)).

#### Focus letter

Which letter is the focus letter depends on how many letters the word has. Only letters and digits count, so quotes and other punctuation are skipped.

| Letters | Focus letter |
| ------- | ------------ |
| 1       | 1st          |
| 2–5     | 2nd          |
| 6–9     | 3rd          |
| 10–13   | 4th          |

Words over 13 letters are split first ([Long words](#long-words)).

Rationale: The rows are the convention's, as in speedread's [`find_ORP`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L93-L98). speedread counts punctuation too. Readalez doesn't, so that a quote mark doesn't move the focus letter.

#### Fixed spot

Each word is placed so that its focus letter lands on the focus point, 40% of the way across the word frame.

Rationale: The eyes never have to move. Left of centre, since most of a word sits to the right of its focus letter. 40% because at a third, 5- and 6-letter words sat wholly in the left half of the screen (#36).

#### Look

The focus letter is drawn in the highlight colour, red by default, and the rest of the word in the text colour. A thin line runs above and below the word frame, each with a short tick at the focus point.

#### Highlight settings

The highlight can be turned off. The focus letter then takes the text colour, and stays in place. A few highlight colours are offered. Each has a contrast ratio of at least 3:1 against the background, in both themes.

Rationale: Some readers find the colour distracting, and colour-blind readers need a choice. 3:1 is WCAG's minimum for large-scale text, 18 point or more ([WCAG 2.2, 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)). Whether a word shrunk to fit, or the smallest text size, stays that large is not checked.

#### Long words

A word over 13 letters is shown in parts of at most 13 letters, each with its own focus letter:

- The word is cut first at its own hyphens, or at the slashes and dots of a web address.
- Only as many cuts are made as needed. So "twenty-seven-year-old" shows "twenty-seven-", then "year-old".
- A part still over 13 letters is cut into the fewest even parts.
- Every part but the last ends with a hyphen, unless it already ends with a hyphen, slash or dot.

Rationale: 13 letters fit the word frame at the largest text size ([Text size](#text-size)). Cutting at a hyphen only while a part is too long gives fewer, fuller flashes. SpritzerTextView does the same ([`Spritzer.java`](https://github.com/andrewgiang/SpritzerTextView/blob/8c5dd53843a6d6525d7faa7a4be9b69ee294142e/lib/src/main/java/com/andrewgiang/textspritzer/lib/Spritzer.java#L213-L268)).

#### Words

Text between spaces is a word, with its punctuation attached.

- Hyphenated words and numbers stay whole ("well-known", "1,000.50").
- Words joined by a dash with no spaces split after the dash, where both sides have a letter or digit. So "yes—no" shows "yes—", then "no".
- `--`, `―`, `⸺` and `⸻` count as dashes. An en dash (`–`) doesn't, so "1914–1918" stays whole.
- A piece with no letters or digits isn't shown on its own. A spaced dash or ellipsis joins the word before it, with its space ("paused —").
- A line of only symbols, such as `* * *`, is a scene break, and ends a paragraph.
- Some marks join the word after them: opening quotes and brackets, `¿` and `¡`, and a symbol with no word before it, such as a dialogue dash at the start of a paragraph ("« Bonjour »", "— Привет,").
- `&` shows as a word.

Rationale: The spaces keep the text as written. An opening mark belongs to the word it opens, as in French, Spanish and Russian dialogue.

#### Accents

A letter with accents counts as one letter, and is highlighted as one, however it is encoded.

#### Text size

At the largest text size, a 13-letter word such as "comprehension" fits on a 375-px-wide screen in portrait. A word that still doesn't fit shrinks while it shows, and is never clipped.

Rationale: No reason is recorded for 375 px ([Open questions](#open-questions)).

### 6. Timing

Each word shows for a time set by the speed, with pauses on top at punctuation, sentence ends, paragraph ends and headings.

#### Speed

100 to 1,000 words per minute, in steps of 10, starting at 300. One speed applies to all books.

Rationale: No reason is recorded for the lower bound of 100. Above about 1,000 wpm, a word gets fewer than 4 screen refreshes at 60 Hz. In Low Power Mode, iPhone Safari throttles animation frames to 30 per second ([WebKit bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745)), so timing would turn uneven. One speed for all books is the simplest.

#### What the speed means

The speed is the base speed. An ordinary word shows for 60,000 ÷ wpm milliseconds, 200 ms at 300 wpm. Pauses come on top, so the real average runs below the setting. Time left uses the same rules, apart from [the pause after play](docs/known-issues.md#time-left-leaves-out-the-pause-after-play).

Rationale: Other Spritz-style readers use the same convention ([ADR 0017](docs/adr/0017-start-timing-at-these-values.md)).

#### Starting values

| A word that…                                                       | Shows for     |
| ------------------------------------------------------------------ | ------------- |
| is ordinary                                                        | 1×            |
| has 8 or more letters                                              | 1.3×          |
| ends with `,` `;` `:` a dash or a closing bracket                  | 1.5×          |
| ends a line of verse                                               | 2×            |
| ends a sentence (`.` `!` `?` `…`, also when closing quotes follow) | 2×            |
| ends a paragraph or a heading, or comes right before a heading     | 5×            |
| is the first after you press play or jump                          | at least 1.5× |

- Of the punctuation rows, only the largest applies.
- The long-word factor multiplies it, so a long word that ends a sentence shows for 2.6×.
- The first word after play or a jump shows for the larger of 1.5× and its usual time.
- Each part of a split word is timed by its own length, with the punctuation pauses on the last part. The hyphen added at a split isn't a dash.

Rationale: These are starting values, to be tuned by feel on a device with the tuning screen (feature 11). [ADR 0017](docs/adr/0017-start-timing-at-these-values.md) gives the values they started from and why they changed.

#### Abbreviations

Some abbreviations rarely end a sentence: titles, initials ("J. R. R.") and words such as "Mr.", "Dr.", "e.g.", French "M.", German "z. B." and Polish "np.". They get no sentence pause unless they end a paragraph, and neither do decimals ("3.14"). Abbreviations that often end a sentence, such as "etc." and "U.S.", end one when the next word starts with a capital letter. Known gaps: [docs/known-issues.md](docs/known-issues.md#timing-and-sentences).

Rationale: This is the simplest form of what sentence splitters such as [pySBD](https://github.com/nipunsadvilkar/pySBD) and [NLTK's Punkt](https://www.nltk.org/api/nltk.tokenize.punkt.html) do with abbreviations.

#### Languages

Readalez reads languages whose words can be shown one at a time with a highlighted letter. It aims at alphabets close to the Latin one. Each language's quote marks and punctuation count as punctuation, not as letters. Its words follow the same rules as English (feature 5). The rules are tuned on English first.

Rationale: Such alphabets split words at spaces and read left to right, as features 5 and 6 assume ([Out of scope](#out-of-scope-for-v1)). The built-in books are in English, so English gets tuned first.

#### Chapter titles

Chapter titles show as words, with the paragraph pause around them. Reading flows on into the next chapter without stopping.

#### No drift, no skipped words

Words follow a fixed schedule, so small timer delays don't add up. If the device falls behind, reading slows down rather than skip a word: every word is on screen for at least one refresh.

#### Speed changes

A speed change takes effect from the next word.

#### Time left

Time left, for the chapter and for the book, is computed from the same rules at the current speed.

### 7. Reader

The screen where a book plays, one word at a time, in the word frame.

#### Controls

Tapping the word frame plays or pauses. Below the frame are two rows of buttons. The first row has slower and faster, by 10 wpm, either side of the current speed. The second has back and forward a sentence. Holding slower or faster keeps changing the speed until you let go. On desktop, Space plays or pauses, ← and → move by a sentence, and ↑ and ↓ change the speed.

Rationale: One big tap target suits a phone. Controls that share a row are harder for a first-time reader to tell apart, and that is worth the screen space of a second row. Holding to keep stepping saves many taps. It is also how a stepper behaves on iPhone, where [`UIStepper`'s `autorepeat`](https://developer.apple.com/documentation/uikit/uistepper/autorepeat) is on by default.

#### Back a sentence

Back goes to the first word of the sentence on screen. If that word is already on screen, it goes to the first word of the sentence before.

Rationale: Jumping a whole sentence back from mid-sentence looks odd when any word can be picked in the paused view.

#### Resume where you left off

Pressing play after a pause, or in a book just opened, starts at the word on screen.

Rationale: The paused view shows the sentence around the word and lets you pick any word to start from. Going back to the sentence start would only get in the way.

#### Paused view

When paused, the current word stays in the word frame. The chapter's text appears below it, scrollable, with the current word marked. Tapping a word in the text moves the word frame to that word, and play then starts exactly there. A tap only moves. Play stays with the word frame and Space, so a second tap on the word doesn't play.

Rationale: The paused view helps you recover a lost thread. No reason is recorded for why a second tap doesn't play.

#### Chapter list

The chapter list holds the chapters and every skipped part, including the notes and the publishing paperwork. Each skipped entry is marked as skipped, and the entry you're in is highlighted. Tapping an entry jumps to its start, paused. A part that the book's table of contents doesn't list gets an entry titled with its first paragraph, cut as a pasted title is (feature 1).

#### Progress bar

A draggable progress bar covers the reading flow. Letting go moves to the start of the nearest sentence. The bar stays on screen while playing, dimmed and locked, so it can be dragged only while paused.

Rationale: A drag while playing would move the place mid-reading.

#### Time left in the reader

Time left shows for the chapter and the book, in minutes and seconds (`h:mm:ss` from an hour). It shows only while paused.

Rationale: Seconds, so that a chapter's time left can be checked with a stopwatch to within 2%. Hidden while playing, since the times draw attention from the words.

#### What a chapter is

For the paused view and the chapter's time left, a chapter runs from one chapter-list entry to the next, at any depth, so the deepest entry wins. A part of the reading flow also starts a chapter, so a chapter is wholly in or out of the flow. Before the first entry, a chapter runs from the start of the book. With no chapter list, as in pasted text, the whole text is one chapter. A chapter can span the book's files.

Rationale: This is KOReader's rule ([readertoc.lua](https://github.com/koreader/koreader/blob/a3ebf281fc19483173b48e71b39ee5e949833385/frontend/apps/reader/modules/readertoc.lua#L598-L608)). A file can hold many chapters: Gutenberg's _Moby Dick_ has 135 chapters in 11 files ([fixtures](tests/fixtures/epub/README.md)).

#### Finished card

After the reading flow's last word, a card shows three numbers: the word count of the reading flow, so without the license or notes, your total reading time for it, and your real average speed. The book is marked finished. The card offers to go back to the library, or to start over. Starting over goes to the flow's first word, paused, and the book is no longer marked finished. The keys do nothing while the card shows. The word count counts runs of text between spaces, so "yes—no" is one word.

Rationale: The simplest count. It needn't match the words shown exactly.

#### Pausing by itself

Reading pauses when the app goes to the background, the screen locks or the tab is hidden. It never resumes on its own.

#### Screen awake

The screen stays on while words play. Once paused, it can lock as usual.

### 8. Settings

Settings holds:

- the speed;
- the highlight, on or off, and its colour;
- the theme, which follows the system or is set to light or dark;
- the text size;
- the backup file's export and import (feature 9);
- deleting all data;
- About (feature 13).

#### Delete all data

Deleting all data asks for confirmation, then removes your own books, progress, settings and reading sessions. The built-in books stay, at 0%.

### 9. Backup file

One file carries your own books' text, every book's progress, your settings and your reading sessions between devices.

#### Export

Export writes the file. On iPhone, it can be saved to Files.

#### Import

Import merges a backup into this device. Books missing here are added. For a book on both, the position from whichever device read it last wins. Sessions are combined without duplicates.

Rationale: It works as a manual sync between iPhone and desktop.

#### Settings in a backup

Settings from a backup replace this device's only when the device has no reading yet.

Rationale: Text size and theme often differ between a phone and a desktop.

#### Books match by text

Books match across devices by their text, so the same edition imported on two devices counts as one book.

#### Bad files

A file that isn't a Readalez backup, or that comes from a newer version, shows a message and changes nothing. A backup carries a format version, so later versions can read older backups.

### 10. Reading sessions

Each reading session is recorded on the device: when it started, the book, the words read, the playing time and the real average speed.

Rationale: Stats come after v1, and this way they start with a history.

#### Start and end

A session starts with play. It ends when the book is closed, when the app goes to the background, or after 5 minutes paused. Paused time doesn't count. The words read are the words shown while playing, re-reads included.

Rationale: A 5-minute break ends a sitting. Counting only playing time keeps the average speed honest.

#### Where sessions go

In v1, sessions show only on the Finished card. They go into backups. Deleting all data removes them, and deleting a book keeps its sessions.

### 11. Tuning screen

The tuning screen has a slider for every value in the timing table (feature 6), and one for the long-word threshold. It plays a passage from a built-in book at the current speed with the current values. It can copy the values to the clipboard, as text to paste into an issue, and reset them to the defaults. The values apply on this device only, until a PR makes them the defaults. It is reached through About, not from the main settings.

Rationale: Timing feels robotic until it is tuned by feel on a device, and a PR records the result. No reason is recorded for its place behind About.

### 12. Install, offline and updates

#### Install

The app installs as a full-screen app named Readalez, with its own icon. On iPhone it installs with Safari's Add to Home Screen. On Android it installs with Chrome's install option, and on desktop with Chrome's or Edge's. Firefox runs it in a tab.

#### Offline

After the first visit, the app, the built-in books and your own books work without a network. While the built-in books download in the background, a band at the top of the library shows how many are saved and asks you to stay online. It then says the app is ready to use offline, for the rest of the visit, and shows nothing on later visits. If saving fails, the band says so, with a reload to try again.

Rationale: The built-in books are most of the download (feature 3). Going offline before they are saved leaves a book that doesn't open, and without the band nothing shows it.

#### Updates

Updates download in the background and apply at a later launch, never while you read.

#### Install tip

On the first visit in iPhone Safari, outside the installed app, a card explains two things. Safari and the installed app keep separate libraries. Safari deletes a site's script-writable storage after seven days of Safari use without interaction with the site. The card shows how to add the app to the Home Screen. Once dismissed, it doesn't return.

Rationale: Books added in a Safari tab don't appear in the installed app. Web apps added to the Home Screen "are not part of Safari and thus have their own counter of days of use" ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).

#### Keep the data

The app asks the browser for persistent storage. When it asks is #22's choice.

Rationale: Persistent data "is only evicted, or deleted, if the user chooses to" ([MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).

### 13. About, privacy and licenses

About shows the version, a link to the source code and its MIT license, the privacy note, the credits, the third-party licenses, and the way into the tuning screen. The credits name Standard Ebooks for the built-in editions, and Speeedy for any code taken from it.

#### Privacy note

The privacy note tells the reader what [Everything stays on the device](#everything-stays-on-the-device) means for their data. It adds that the web host serving the app's files handles requests as for any website, and that Readalez adds no logging.

#### No requests to other sites

Fonts are the system's, and nothing loads from a CDN. The only outside links are ones you tap: the source code link in About, and the links in [feature 14](#14-where-to-find-books).

#### Licenses

Every dependency bundled into the app is listed, with its license text and any NOTICE file, generated at build time. The allowed licenses are MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0 and CC0-1.0. Any other license fails the build.

Rationale: Readalez can then stay MIT, with every notice shipped.

### 14. Where to find books

A short help note on the Add text screen links to Project Gutenberg and Standard Ebooks. It gives the steps to download an EPUB and import it, on iPhone, on Android and on desktop. It adds that copyright laws differ between countries, and asks readers to check their local laws before reading a book. Readalez itself doesn't check a book's copyright ([known issue](docs/known-issues.md#readalez-doesnt-check-whether-a-book-is-free-to-read-where-you-live)).

Rationale: There is no catalog in v1, so readers need the way to free books.

## Out of scope for v1

Ideas for after v1 live in [docs/roadmap.md](docs/roadmap.md). These are left out for other reasons:

- **Importing from a web link:** not planned. It needs a server that fetches any page, which invites abuse and copyright trouble.
- **Sync and accounts:** not planned. They need a server holding personal data, which brings in UK GDPR. The backup file covers moving between devices.
- **Accessibility conformance (WCAG):** not a v1 goal, as too much work for v1.
- **Right-to-left texts, and Chinese, Japanese or Korean texts:** they need a mirrored layout or a different way of splitting words, which is much more work. Interface languages other than English are out too.
- **Removing or replacing the built-in books.**

## Legal and licensing

These are working assumptions from public sources, not legal advice. Recheck them before anything that changes the risk: charging money, or adding a server or a catalog.

### Copyright

Everything Readalez ships is free of copyright: the built-in books, test fixtures and sample passages. Books readers import stay on their devices and are never uploaded, so the app distributes nothing else.

Rationale: Everyone who opens the app gets a copy of what it ships.

### Built-in books' copyright

The built-in books are public domain in the US and in the UK. Every author and translator died before 1956, and the build checks each one's death year. Translators count as authors here, to be safe.

Rationale: Standard Ebooks says its books "may still be copyrighted in other countries" (each book's `dc:rights`). In the UK, copyright "expires at the end of the period of 70 years from the end of the calendar year in which the author dies" ([Copyright, Designs and Patents Act 1988, section 12(2)](https://www.legislation.gov.uk/ukpga/1988/48/section/12)). So a death in 1955 or earlier means public domain from 2026. Whether the UK treats a translator as an author is not checked.

### Project Gutenberg

Gutenberg's name stays out of the app's name. v1 only links to Gutenberg. It leaves Gutenberg's license pages out of the reading flow of books readers import for themselves (feature 2). The Gutenberg test fixtures keep their license pages.

Rationale: Gutenberg's license, which each of its books carries, says that "If you are redistributing or providing access to a work with the phrase “Project Gutenberg” associated with or appearing on the work, you must comply" with its terms (section 1.E.2, read in `tests/fixtures/epub/gutenberg-11-alice-in-wonderland-epub3.epub`). A later catalog has more of Gutenberg's rules to respect ([roadmap](docs/roadmap.md#public-domain-catalog-and-proxy)).

### Focus-point patents

The fixed focus point (feature 5) is what Spritz's patents describe: [US 8,903,174](https://patents.google.com/patent/US8903174B2/en), the related US 9,483,109 and US 10,332,313, and a European family member validated in Spain as ES 2700224 T3. Whether that family covers the UK is unknown. Keep "Spritz" out of the name and the app's text, and recheck before charging money.

Rationale: The risk is low for a free, open-source app. Free apps use the design openly, such as the open-source readers in [feature 5](#5-single-word-display).

### Privacy

Readalez collects no personal data ([Everything stays on the device](#everything-stays-on-the-device)). Storage on the device holds only what the features a reader uses need, so no consent banner is needed. Adding a server, sync or analytics means revisiting UK GDPR first.

Rationale: The UK's rules on device storage (PECR) exempt storage that is "strictly necessary for the provision of an information society service requested by the subscriber or user" ([PECR, Schedule A1, paragraph 4](https://www.legislation.gov.uk/uksi/2003/2426/schedule/A1)).

### Licenses of code

Dependencies stay permissive, and their notices ship in the app (feature 13). Code copied or adapted from Speeedy (`sami-29/speeedy`, MIT) keeps its copyright notice. Speeedy's test fixtures are never copied, since one of them is a copyrighted book ([`test-fixtures/01-11-2020-212827The 7 Habits of Highly Effective People.pdf`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/test-fixtures/01-11-2020-212827The%207%20Habits%20of%20Highly%20Effective%20People.pdf)). The Standard Ebooks editions are credited as a courtesy.

## How features are checked

A feature's checks live in its tests, which cite the feature by number, and in the feature's issue until it is built. These are the kinds of check:

- **Unit:** unit tests run by `npm run check`, mostly in `src/core` (ADR 0003).
- **E2E:** Playwright against the production build, in Chromium, in WebKit with iPhone emulation, and in Chromium with Android emulation (ADR 0005, [ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)).
- **Build:** a check that runs as part of the build.
- **Review:** checked by reading the diff. [docs/reviews.md](docs/reviews.md) collects each merged PR's review.
- **Device:** checked by hand on the iPhone (installed app, iOS 18.4 or later) and in desktop Chrome, Edge and Firefox. #74 lists the device checks of built features not yet done, and a feature's issue lists its own until it is built. Android has no device checks ([Devices and browsers](#devices-and-browsers)).

Test fixtures follow the [copyright rule](#copyright).

## Open questions

- **Final timing values:** set after tuning on a device (feature 11). The table in feature 6 holds starting values.
- **Speed and size targets:** which ones v1 sets, and at what values (#73).
- **App icon and visual style:** not decided, apart from leaving out Warner Bros.' character ([Name](#name)).
- **Narrowest screen for the largest text size:** feature 5 sizes it for a 375-px-wide screen, with no recorded reason. Android emulation runs at 360 px ([ADR 0010](docs/adr/0010-test-android-chrome-by-emulation.md)), where the word size today fits "comprehension" with about 8 px to spare ([#87](https://github.com/Antananariwa/readalez/pull/87)).

## Glossary

One term per thing, in this file, in the other docs and in the code. A term in bold in the Definition column is the label the app shows for it.

| Term                 | Definition                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backup file          | The one file that carries own books, progress, settings and reading sessions between devices (feature 9).                                                                                                                |
| Base speed           | The speed setting, in words per minute: how long an ordinary word shows, before pauses (feature 6).                                                                                                                      |
| Book                 | Any text in the library: a built-in book or an own book.                                                                                                                                                                 |
| Built-in book        | A book that ships with the app (feature 3).                                                                                                                                                                              |
| Chapter              | The stretch from one chapter-list entry to the next ([What a chapter is](#what-a-chapter-is)).                                                                                                                           |
| Chapter list         | Readalez's list of a book's chapters and skipped parts (feature 7). It is built from the book's own table of contents, or from its headings (feature 2).                                                                 |
| Copy-protected       | Encrypted with DRM, so Readalez can't open it (feature 2).                                                                                                                                                               |
| Finished card        | What shows after the reading flow's last word (feature 7).                                                                                                                                                               |
| Focus letter         | The letter of a word that lands on the focus point, drawn in the highlight colour (feature 5).                                                                                                                           |
| Focus point          | The fixed spot in the word frame where every focus letter lands (feature 5).                                                                                                                                             |
| Install tip          | The card in iPhone Safari that explains installing to the Home Screen (feature 12).                                                                                                                                      |
| Library filter       | Which books the library lists: all, the built-in books or the own books (feature 4). Shown as **All**, **Public** and **My books**.                                                                                      |
| New mark             | The mark on a book just imported, until a book is opened, the Add text screen is opened or the page reloads (feature 2). Shown as **New**.                                                                               |
| Note marker          | A link in the text that leads to a note. It never shows as a word (feature 2).                                                                                                                                           |
| Own book             | A book the reader added by pasting or importing.                                                                                                                                                                         |
| Part                 | A stretch of an EPUB, cut at its chapter-list entries, its headings and changes in the markup's role. Each part is in the reading flow or skipped (feature 2).                                                           |
| Paused view          | The chapter's text under the word frame while reading is paused (feature 7).                                                                                                                                             |
| Position             | A place in a book, down to the word, saved so that reading resumes there (feature 4, ADR 0008).                                                                                                                          |
| Progress             | How far a position is through the reading flow, from 0% to 100% (feature 4).                                                                                                                                             |
| Publishing paperwork | The parts of a book that aren't the author's text: cover, title and copyright pages, contents pages, license pages and the like (feature 2). Front-matter paperwork comes before the reading flow, back-matter after it. |
| Reading flow         | What plays from start to finish: the parts from the author's first to the author's last, without the paperwork between them or the notes (feature 2, ADR 0011).                                                          |
| Reading session      | One sitting of reading a book, as recorded on the device (feature 10).                                                                                                                                                   |
| Section              | A stretch of a book's text as it is stored: one per file in an EPUB's reading order, then one for its notes if it has any, and one for a whole pasted text (features 1 and 2).                                           |
| Time left            | How long the rest of a chapter or of the reading flow takes at the current speed (feature 6).                                                                                                                            |
| Tuning screen        | The screen with a slider for each timing value (feature 11).                                                                                                                                                             |
| Word                 | What the word frame shows at one time. Feature 5's Words and Long words rules say where a text is cut into words.                                                                                                        |
| Word frame           | Where the word shows in the reader, between two lines with a tick at the focus point (feature 5).                                                                                                                        |
