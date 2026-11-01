# Spec

What Readalez does and why. Feature issues are cut from the v1 features below: a feature's checks become the issue's acceptance criteria, and each check says where it runs (see [How features are checked](#how-features-are-checked)). The reasons behind technical choices live in [docs/adr](docs/adr/). When a decision here changes, change this file in the same PR, with the new reason.

## What Readalez is

A free, open-source speed-reading web app for practicing on real, meaningful texts. v1 shows one word at a time with a highlighted focus letter; guided reading through full paragraphs comes later. It's a PWA (ADR 0002), so it installs from the browser on iPhone and desktop.

- **Public.** Anyone with the link can use it, and it's a portfolio piece. Why: the owner's choice. So privacy, copyright and polish are judged for strangers, not only for the owner.
- **Free and open source (MIT).** Why: the owner's choice for a public portfolio piece; it also keeps the patent risk low (see [Legal and licensing](#legal-and-licensing)).
- **Named Readalez**, a nod to Speedy Gonzales. Why: catchy and original (no app or GitHub repo used the name in October 2026), its 8 letters fit under an iPhone icon, and it avoids the Project Gutenberg and Spritz names. The nod stays in the name only: no mouse, sombrero, "¡Ándale!" or other reference to the Warner Bros. character in the icon or the app's text. That keeps clear of their trademark and of the criticism the character has drawn as a stereotype.

## Ground rules

These apply to every feature.

- **iPhone first.** Every v1 feature works in the installed Home Screen app on iOS 18.4 or later, and in a Safari tab. Why: the owner reads on an iPhone, and Safari is how a PWA installs there (ADR 0002).
- **Everything stays on the device.** No accounts, no server of our own, no analytics, no cookies, no ads. Texts, progress, settings and reading sessions live in the browser's storage, and a backup file moves them between devices. Why: privacy without paperwork (see [Legal and licensing](#legal-and-licensing)), nothing to host or pay for, and the app works offline.
- **Established designs, simplest version first.** Where speed-reading apps share a convention (the focus letter, pause lengths), Readalez follows it, and departures need a reason. Each feature starts as the simplest version that works. Why: the owner's direction; proven conventions need less tuning than new designs.

## Devices and browsers

- **iPhone:** iOS 18.4 and later, in the installed app and in Safari. Why: 18.4 is the first version where an installed web app can keep the screen awake while you read; on earlier versions the screen dims and locks mid-chapter. It covers iPhone XS and XR (2018) and newer. MDN's compatibility data lists that fix in 18.4 while caniuse still flags the bug, so feature 7's screen-awake device check runs as early as possible.
- **Desktop:** current Chrome, Edge and Firefox. Chrome and Edge can install the app; Firefox runs it in a tab. Why: the owner's choice.
- **Not checked in v1:** Safari on Mac, Android Chrome and iPad. They run the same engines and will likely work, but nobody checks them. Why: every checked browser adds a manual check per release. An Android store app through Capacitor comes later (ADR 0002).
- Portrait and landscape both work. The interface is in English.

## v1 features

Fourteen features. The order to build them in is under [Suggested build order](#suggested-build-order).

### 1. Add text by pasting

A paste box on the Add text screen. Saving adds the text to the library and opens it at the first word. Why: the quickest way in for articles and snippets; on iPhone, copy from Safari's Reader view.

- **Paragraphs.** Blank lines separate paragraphs. If the text is hard-wrapped (most lines break mid-sentence at similar lengths, as in Gutenberg's plain-text files), single line breaks are joined with spaces; otherwise each line is its own paragraph. Why: text copied from Safari's Reader view has one paragraph per line, Gutenberg's wraps about every 70 characters, and both should read as written.
- **Gutenberg license text.** If the text contains Gutenberg's `*** START OF` and `*** END OF` lines, only the part between them is kept. Why: reading starts at the first real word, as with EPUBs.
- **Title.** The first line, cut at a word boundary to at most 60 characters. It can be edited before saving and later in the library.
- **No chapters.** Pasted text is one section. Why: books come in as EPUB; guessing chapters from plain text returns with TXT import, after v1.
- **No verse.** Pasted text carries no verse markup, so a pasted poem follows the paragraph rules above; verse pauses (feature 6) come from EPUBs.

Checks:

- Unit: a hard-wrapped Gutenberg chapter comes out as its original paragraphs; text with one paragraph per line keeps each line as a paragraph.
- Unit: Gutenberg's header and footer, marker lines included, are left out.
- Unit: the title is the first line, cut at a word boundary to 60 characters.
- E2E: after pasting and saving, the reader opens at the first word, and the library lists the text under its title.
- Device: an article copied from Safari's Reader view on iPhone reads paragraph by paragraph.
- Device: a novel's worth of text (about 1 MB) pastes and saves on iPhone in under 3 seconds.

### 2. Import EPUB files

Import EPUB on the Add text screen opens the file picker (Files on iPhone). The book is read on the device, added to the library and opened at its first chapter. Why: EPUB is the format every big public-domain library offers (Project Gutenberg, Standard Ebooks, Wikisource), and it marks chapters and paragraphs, so nothing has to be guessed.

- **Supported:** EPUB 2 and 3 without DRM. The reading order is the book's spine. The chapter list comes from the book's table of contents, or from its headings if it has none.
- **Reading starts where the author's text starts** the first time a book opens. Publishing paperwork stays out of the reading flow: the cover, title and half-title pages, copyright and imprint pages, contents pages, lists of illustrations, pages left empty once images are dropped (such as a frontispiece) and Gutenberg's license pages. Everything the author wrote stays in, from dedications, epigraphs and prefaces to afterwords and appendices; a preface counts even when the book's markup places the main text after it, as Standard Ebooks does. Sections are recognised from the book's markup (EPUB 3 semantics or the EPUB 2 guide), then from Gutenberg's markers and section titles. Why: you open a book to read it, not its paperwork.
- **The reading flow ends with the author's last words**, where the Finished card shows (feature 7). Notes and back-matter paperwork (colophons, copyright pages, Gutenberg's closing license) come after it. Why: finishing a book shouldn't mean reading its license.
- **Everything skipped stays reachable** from the chapter list. Playing a skipped section reads it to its end and stops there.
- **Notes.** Note markers (¹, [12], * and other links to notes) never appear in the word stream. The notes themselves are gathered into a Notes section at the end. Why: a marker flashing as its own word breaks the flow.
- **Kept:** headings, paragraphs, block quotes, list items and table rows (each one a paragraph), and line breaks in verse (each gets a pause, see feature 6). **Dropped:** images, with their alt text and captions, since they describe pictures that aren't shown. Soft hyphens and zero-width characters are removed, and non-breaking spaces read as spaces.
- **Title and author** come from the book's metadata, falling back to the file name and "Unknown author".
- **Copy-protected books** (Kindle, Apple Books and Adobe DRM) show "This book is copy-protected (DRM), so Readalez can't open it." Fonts scrambled for licensing (EPUB font obfuscation) are not DRM, and those books open.
- **Errors.** A file that isn't a readable EPUB shows a clear message, and nothing half-imported appears in the library.
- **Same book twice.** Importing a book whose text is already in the library opens the copy you have, with its progress. A different edition is a different book.

Checks:

- Unit: for fixture EPUBs (a Standard Ebooks EPUB 3, a Gutenberg EPUB 3 and a Gutenberg EPUB 2), the chapter list matches each book's contents, and the reading flow starts where the author's text starts, with no cover, title, copyright, contents or license words before it.
- Unit: no note markers appear in the word stream, and the notes appear in a Notes section after the end of the reading flow.
- Unit: a DRM-encrypted fixture gives the DRM message; a fixture with obfuscated fonts opens.
- Unit: a corrupt ZIP and a renamed text file each give an error and leave the library unchanged.
- Unit: soft hyphens and zero-width characters are gone, and each verse line ends with a line-break pause.
- E2E: importing a fixture adds it with the title and author from its metadata and opens it at the first chapter; importing it again opens the same copy, with no duplicate.
- Device: on iPhone, an EPUB downloaded from Standard Ebooks in Safari, saved to Files and imported in the installed app opens at chapter 1.
- Device: a 600,000-word EPUB (about the length of _War and Peace_) imports on the owner's iPhone in under 10 seconds, showing progress, and the app stays responsive.

### 3. Built-in books

Three books are always in the library:

- _A Christmas Carol_ by Charles Dickens (died 1870)
- _Alice's Adventures in Wonderland_ by Lewis Carroll (died 1898)
- _The Strange Case of Dr Jekyll and Mr Hyde_ by Robert Louis Stevenson (died 1894)

Each has roughly 25,000–29,000 words, about two hours at 300 wpm. Why: a new reader can start at once, the owner gets real books for tuning, and they double as test fixtures for EPUB import. Short books keep the download small.

- **Editions:** Standard Ebooks, with the images, the frontispiece page and the list of illustrations removed. Why: proofread, cleanly marked-up EPUB 3, and their own work is dedicated to the public domain (CC0), so there's no license text to carry. Their sources are on GitHub (for example `standardebooks/charles-dickens_a-christmas-carol`), which the dev container can reach.
- **Copyright:** all three authors died over 100 years ago, so the texts are public domain almost everywhere (see [Legal and licensing](#legal-and-licensing)).
- **Permanent:** they can't be deleted or renamed. Their progress works like any book's, and Delete all data resets it. Why: the owner's choice, so there's always something to read and to tune with.
- **One code path:** they ship as EPUB files and go through the same import as the reader's own books.
- **Offline:** they work without a network after the first visit.
- **Backups** hold their progress, not their text.

Checks:

- E2E: a fresh install lists the three books, and each opens where its text starts: the opening poem of _Alice_, Dickens's preface to _A Christmas Carol_ and chapter 1 of _Jekyll and Hyde_.
- E2E: built-in books can't be deleted; after Delete all data they're still listed, at 0%.
- E2E: after the first visit, with the network off, a built-in book opens and plays.
- Unit: the three shipped EPUBs contain no images and total at most 400 KB.

### 4. Library

The app's home screen: every book, built-in and imported, most recently opened first and unopened books last, so the book you're reading is on top. Each shows its title, author, progress, time left at the current speed and when it was last opened. Tapping a book opens it where you left off (feature 7 says where reading resumes). Imported books can be renamed and deleted, with a confirmation.

- **Progress is saved while you read:** on pause, when you leave the reader, when the app goes to the background, and every few seconds while playing. Why: iOS can close a web app in the background without warning.
- **Progress and time left** measure the reading flow (feature 2): 0% at its first word and 100% at the Finished card. A position in a skipped section counts as 0% before the flow and 100% after it.
- **Positions survive updates.** A position is stored by chapter, paragraph and word, so when a later version splits words differently, you land in the same paragraph. Why: the splitting rules will change as timing gets tuned.

Checks:

- E2E: the library shows the title, author, progress, time left and last opened date of each book, sorted by last opened.
- E2E: renaming one imported book and deleting another both survive a reload.
- Unit: a saved position still points into the same paragraph after a change to the word-splitting rules (for example, splitting at em dashes).
- Device: after force-quitting the installed app mid-reading, the word marked in the reopened book is at most 5 seconds of reading behind where it stopped.

### 5. Single-word display

One word at a time, in the layout Spritz introduced in 2014 and open-source readers copy (OpenSpritz, speedread, SpritzerTextView, Speeedy). Why: it's the convention, and it rests on reading research: the eye recognises a word fastest when it lands a little left of the word's centre.

- **Focus letter by length.** Only letters and digits count, so quotes and other punctuation are skipped:

  | Letters | Focus letter |
  | ------- | ------------ |
  | 1       | 1st          |
  | 2–5     | 2nd          |
  | 6–9     | 3rd          |
  | 10–13   | 4th          |

  Words over 13 letters are split first (see Long words), so the convention's last row, the 5th letter for 14 letters or more, never applies.

- **Fixed spot.** Each word is placed so its focus letter lands on the same point every time, about a third of the way across the word area, since most of a word sits to the right of its focus letter. Why: the eyes never have to move.
- **Look.** The focus letter is drawn in the highlight colour (red by default) and the rest of the word in the text colour. Thin lines run above and below the word area, each with a short tick at the focus point; Spritz calls this frame the "redicle".
- **Highlight settings.** The highlight can be turned off: the focus letter then takes the text colour, and nothing moves. Five highlight colours are offered, each readable on both the light and the dark theme. Why: some readers find the colour distracting, and colour-blind readers and dark mode need choices.
- **Long words.** A word longer than 13 letters is split at its own hyphens first (or at slashes and dots in a web address); any part still longer than 13 letters is then split into the fewest even parts of at most 13 letters. Every part but the last ends with a hyphen, unless it already ends in one of those marks, and every part gets its own focus letter. Why: the established approach; 13 letters is what fits.
- **Words.** Text between spaces is a word, with its punctuation attached. Hyphenated words stay whole ("well-known"); words joined by a dash without spaces are split ("yes—no" shows "yes—", then "no"); numbers stay whole ("1,000.50"). Gutenberg's `--` counts as a dash. A piece with no letters or digits isn't shown on its own: a spaced dash or ellipsis joins the word before it as its punctuation, and a line of only symbols (such as `* * *`) is a scene break that counts as a paragraph end. The exception is `&`, which shows as a word.
- **Accents and scripts.** A letter with accents counts and highlights as one letter, however it's encoded. Greek and Cyrillic words follow the same rules.
- **Text size** goes up to the largest size at which a 13-letter word such as "comprehension" still fits on a 375-px-wide screen (iPhone SE) in portrait. A word that still doesn't fit, such as one in wide capitals, shrinks to fit while it shows and is never clipped.

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

- **Speed:** 100–1,000 words per minute, in steps of 10, starting at 300. One speed applies to all books, the owner's choice as the simplest. Why this range: it's the common one in speed-reading apps. Above about 1,000 wpm a word gets fewer than 4 screen refreshes, and iPhone's Low Power Mode halves the refresh rate for web pages, so timing turns uneven.
- **What the number means:** the base speed. An ordinary word shows for 60,000 ÷ wpm milliseconds (200 ms at 300 wpm), and pauses come on top, so the real average runs below the setting. Why: the convention (OpenSpritz, speedread, Speeedy), and time left stays accurate because it uses the same rules.
- **Starting values,** to be tuned on the owner's iPhone with the tuning screen (feature 11):

  | A word that…                                                       | Shows for   |
  | ------------------------------------------------------------------ | ----------- |
  | is ordinary                                                        | 1×          |
  | has 8 or more letters                                              | 1.3×        |
  | ends with `,` `;` `:` a dash or a closing bracket                  | 2×          |
  | ends a line of verse                                               | 2×          |
  | ends a sentence (`.` `!` `?` `…`, also when closing quotes follow) | 3×          |
  | ends a paragraph or a heading, or comes right before a heading     | 4×          |
  | is the first after you press play or jump                          | at least 3× |

  Of the punctuation rows, only the largest applies; the long-word factor multiplies it, so a long word ending a sentence gets 3.9×. The first word after play or a jump shows for the larger of 3× and its usual time. Each part of a split word is timed by its own length, with punctuation pauses on the last part; the hyphen added at a split isn't a dash. Why: these follow the open-source Spritz-style readers (speedread uses 2× for commas and 3× for full stops; Speeedy about 1.8× and 3×, plus a pause between paragraphs), and timing feels robotic until tuned by feel on a device.

- **Abbreviations don't end sentences.** "Mr.", "Dr.", "e.g.", "i.e.", "U.S.", initials ("J. R. R.") and decimals ("3.14") get no sentence pause, and neither do common abbreviations in the other European languages (French "M.", German "z. B.", Polish "np." and so on). A known abbreviation ends a sentence only as the last word of a paragraph.
- **Languages.** English, plus European languages written in Latin, Greek or Cyrillic script. Their quote marks and punctuation (« », „ “, ‹ ›, ¿ ¡) count as punctuation, not letters, and after a Greek word `;` is a question mark that ends the sentence. Rules are tuned on English first. Why: the owner's choice.
- **Chapter titles** show as words, with the paragraph pause around them, and reading flows on into the next chapter without stopping.
- **No drift, no skipped words.** Words follow a fixed schedule, so small timer delays don't add up. If the device falls behind (in Low Power Mode, for example), reading slows down rather than skipping words: every word is on screen for at least one refresh.
- **Speed changes** take effect from the next word.
- **Time left** for the chapter and the book is computed from the same rules at the current speed.

Checks:

- Unit: at 300 wpm, every word of a fixed passage gets exactly the duration in the table (the passage has commas, sentence ends, a paragraph end, a heading, a line of verse and long words).
- Unit: abbreviations, initials and decimals get no sentence pause, and sample sentences in English, French, German, Spanish, Polish, Russian and Greek get the right pauses.
- Unit: with a fake clock, 1,000 words at 1,000 wpm finish within 1% of their computed total; with frames arriving only every 33 ms (30 Hz) and one 250 ms stall, every word still shows, in order, with none skipped.
- Unit: time left equals the sum of the remaining words' durations.
- Device: at 300 and at 600 wpm on iPhone, a chapter takes the time left shown at its start, within 2% by stopwatch.

### 7. Reader

- **Controls.** Tap the word frame to play or pause. Buttons below it: back a sentence, forward a sentence, slower and faster (10 wpm each). On desktop, Space plays or pauses, ← and → move by a sentence, and ↑ and ↓ change the speed. Why: one big tap target suits a phone.
- **Resume at the sentence start.** Pressing play after a pause, or opening a book, starts at the first word of the current sentence. Why: you re-enter with context, at the cost of a few seconds after short pauses.
- **Paused view.** When paused, the current word stays in its frame, and the text around it appears below, scrollable through the chapter, with the current word marked. Tapping a word in the text moves the frame to that word, and play then starts exactly there. Why: it helps you recover a lost thread, and the later paragraph pacer can build on it.
- **Navigation.** A chapter list, including the skipped front matter, the Notes and the publishing pages; tapping an entry jumps to its start. A draggable progress bar covers the reading flow, and letting go moves to the start of the nearest sentence. Time left shows for the chapter and the book.
- **Finished card.** After the last word of the last chapter, a card shows the book's word count, your total reading time for it and your real average speed, and the book is marked finished. The card offers Back to library and Start over.
- **Pausing by itself.** Reading pauses when the app goes to the background, the screen locks or the tab is hidden, and it never resumes on its own.
- **Screen awake.** The screen stays on while words are playing, and can lock as usual once paused.

Checks:

- E2E: tapping the word frame and pressing Space each toggle between playing and paused, including from the paused view.
- E2E: after pausing mid-sentence, pressing play shows that sentence's first word first.
- E2E: the back and forward buttons and the ← and → keys move to the previous and next sentence starts; the speed buttons and ↑ and ↓ change the speed by 10, within 100–1,000.
- E2E: the paused view marks the current word; after tapping another word in the text, the frame shows that word and play starts at it.
- E2E: the chapter list shows the front matter, chapters, Notes and publishing pages, and tapping one jumps to its start.
- E2E: dragging the progress bar to the middle lands on a sentence start near the middle of the reading flow.
- E2E: hiding the page pauses reading.
- E2E: reading the last word shows the Finished card with the word count, reading time and average speed, and the library shows the book as finished.
- Device: in the installed app on iPhone, with Auto-Lock at 30 seconds, two minutes of playing keep the screen on, and after pausing it locks as usual.
- Device: switching to another app while reading pauses it, and the reader is still paused on return.

### 8. Settings

Speed, highlight on or off, highlight colour, theme (follows the system, or light, or dark), text size, Export backup and Import backup (feature 9), Delete all data, and About (feature 13).

- **Delete all data** asks for confirmation, then removes imported books, progress, settings and reading sessions. The built-in books stay, at 0%.

Checks:

- E2E: every setting survives a reload.
- E2E: the theme follows the system until it's set to light or dark.
- E2E: after Delete all data, the library holds only the built-in books, at 0%, the settings are back to their defaults and no sessions remain.

### 9. Backup file

- **Export** writes one file with the text of your imported books, the progress of every book, your settings and your reading sessions. On iPhone it can be saved to Files.
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

- **Install.** Add to Home Screen in iPhone Safari, or the install button in Chrome and Edge, gives a full-screen app named Readalez with its own icon. Firefox runs it in a tab.
- **Offline.** After the first visit, the app, the built-in books and every imported book work without a network.
- **Updates** download in the background and apply at the next launch, never while you read.
- **Install tip.** On the first visit in iPhone Safari (not in the installed app), a card explains that Safari and the installed app keep separate libraries, and that Safari may clear a site's data after 7 days without a visit; it shows the Add to Home Screen steps. Once dismissed, it doesn't return. Why: books imported in a Safari tab don't appear in the installed app, and the installed app is exempt from the 7-day clearing.
- **Keep the data.** After the first import, the app asks the browser for persistent storage, so its data isn't cleared to free space.

Checks:

- E2E: after one visit, the app reloads with the network off, and a built-in book plays.
- E2E: a new version deployed while a book is playing doesn't reload the page, and the next launch runs it.
- E2E: the install tip shows once in emulated iPhone Safari (not installed) and never in other browsers.
- E2E: after the first import, the app has requested persistent storage.
- Device: Add to Home Screen on iPhone gives a Readalez icon that opens full screen, and in Airplane Mode the library and reading still work.

### 13. About, privacy and licenses

About shows the version, a link to the source code and its MIT license, the privacy note, the credits (Standard Ebooks for the built-in editions, and Speeedy for any code taken from it), the third-party licenses, and the way into the tuning screen.

- **Privacy note.** Readalez has no accounts, analytics, cookies, ads or server of its own. Your books, progress, settings and reading sessions stay on this device unless you export a backup. The web host that serves the app's files handles requests as it does for any website; Readalez adds no logging.
- **No requests to other sites.** Fonts are the system's, nothing loads from CDNs, and the only outside links are the help links you tap.
- **Licenses.** Every dependency bundled into the app is listed with its license text and any NOTICE file, generated at build time. Allowed licenses: MIT, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Apache-2.0 and CC0-1.0. Anything else fails the build until the owner adds it to the list. Why: so Readalez can stay MIT with every notice shipped.

Checks:

- E2E: a full session (open, paste, import, read, export) makes requests only to the app's own origin.
- E2E: About lists every bundled dependency with its license.
- Build: a bundled dependency whose license isn't on the allowed list fails the build.
- Review: code copied or adapted from Speeedy keeps Speeedy's MIT copyright notice at the top of its file and is named in the credits.

### 14. Where to find books

A short help note on the Add text screen. It links to Project Gutenberg and Standard Ebooks and gives the steps: on iPhone, download the EPUB in Safari (it lands in Files, under Downloads), then Add text, Import EPUB; on desktop, download, then import. It adds that these libraries check copyright for the US only and that local rules apply elsewhere: in the UK, a work becomes free 70 years after its author's death (and a translation 70 years after its translator's). Why: there's no catalog in v1, so readers need the way to free books.

Checks:

- E2E: the links go to gutenberg.org and standardebooks.org and open in a new tab.
- Device: following the iPhone steps with a Standard Ebooks book ends with the book open in the installed app.

## Out of scope for v1

- **Paragraph pacer:** later. It's fiddly on a phone, single-word timing comes first, and the paused view (feature 7) is its base.
- **Public-domain catalog and proxy:** later. Importing by hand avoids running a proxy, Gutenberg's blocking of automated traffic and copyright filtering by country, and the built-in books cover a reader's first use. [Legal and licensing](#legal-and-licensing) lists what a catalog has to respect.
- **TXT, PDF, Word and other formats:** later, one format per issue. TXT needs guesswork about line breaks and chapters, and text from PDFs is messy.
- **Importing from a web link:** not planned. It needs a server that fetches any page, which invites abuse and copyright trouble.
- **Stats screens:** later. Sessions are recorded from v1 (feature 10).
- **Word chunks** (two or three words at a time): later.
- **Sync and accounts:** not planned. They need a server holding personal data, which brings in UK GDPR, and the backup file covers moving between devices.
- **An Android store app** through Capacitor: later (ADR 0002).
- **Accessibility conformance** (WCAG): not a v1 goal. Why: the owner's decision.
- **Right-to-left texts and Chinese, Japanese or Korean texts:** they need a mirrored layout or a different way of splitting words, which is much more work. Interface languages other than English are out too.
- **Extras other apps have:** per-book speed, speed ramps and training plans, comprehension quizzes, sounds and text-to-speech, "bionic" reading, dyslexia fonts and colour overlays. Each one is a separate product decision.
- **Removing or replacing the built-in books.**

## Legal and licensing

Working assumptions from public sources, not legal advice. Recheck them before anything that changes the risk: charging money, or adding a server or a catalog.

- **Copyright.** UK copyright lasts 70 years after the author's death, and a translation's lasts 70 years after the translator's; some countries go up to 100. Everything Readalez ships (the built-in books, test fixtures and sample passages) is by authors, translators and illustrators who died over 100 years ago, so it's public domain almost everywhere the app is served or cached. Books readers import stay on their devices and are never uploaded, so the app distributes nothing else.
- **Project Gutenberg.** Its name stays out of the app's name. In v1 the app only links to Gutenberg and leaves Gutenberg's license pages out of the reading flow of books readers import for themselves. A later catalog has to respect Gutenberg's rules: its website is for human users only, and automated traffic gets IP addresses blocked; bulk users must use its mirrors and offline catalog files; a text that keeps the Project Gutenberg name must carry its license, while one stripped of every Gutenberg mention is a plain public-domain text; and it checks copyright for the US only. So a catalog offers only works that are public domain in the UK, translators included (the exact rule is an open question), and any proxy cache stays short-lived, because cached copies sit in countries whose rules differ.
- **Focus-point patents.** The fixed focus point in feature 5 is what Spritz's patents describe: US 8,903,174 ("Serial text display for optimal recognition apparatus and method", filed 2012; Google Patents lists it as active, which isn't verified), the related US 9,483,109 and US 10,332,313, and a European family member (validated in Spain as ES 2700224 T3, so UK coverage is possible). The Chinese and Japanese members have lapsed. Free apps use the design openly, and the risk is low for a free open-source app. Recheck before charging money, and keep "Spritz" out of the name and the app's text.
- **Name.** See [What Readalez is](#what-readalez-is).
- **Privacy.** With no accounts, analytics, cookies, ads, logging or server of its own, Readalez collects no personal data. Storage on the device holds only what the features a reader uses need, which the UK's rules on device storage (PECR) treat as strictly necessary, so no consent banner is needed. Adding a server, sync or analytics means revisiting UK GDPR first.
- **Licenses.** Readalez is MIT. Dependencies stay permissive, and their notices ship in the app (feature 13). Code copied or adapted from Speeedy (`sami-29/speeedy`, MIT) keeps its copyright notice. Its test fixtures are never copied: one of them is a copyrighted book. The Standard Ebooks editions are CC0 and credited as a courtesy.

## How features are checked

- **Unit:** unit tests run by `npm run check`, mostly in `src/core`, where reading rules are tested exactly and quickly (ADR 0003). The Stop hook runs them.
- **E2E:** Playwright in the dev container, in headless Chromium and in WebKit with iPhone emulation, including screenshots and measurements. Why WebKit: it's the closest automated stand-in for iPhone Safari. It catches engine differences (CSS, layout, JavaScript, web APIs), not iOS-only behaviour such as the Home Screen app, the on-screen keyboard or touch, so the Device checks stay (ADR 0005).
- **Build:** a check that runs as part of the build.
- **Review:** checked by reading the diff.
- **Device:** the owner on the iPhone (installed app, iOS 18.4 or later) and in desktop Chrome, Edge and Firefox. Each PR's How to test lists them.
- **Test fixtures** follow the copyright rule in [Legal and licensing](#legal-and-licensing).

## Suggested build order

1. Scaffold: build, tests, CI, hosting with PR previews and the PWA shell.
2. Reading core: splitting text into sections, paragraphs and words, focus letters, long-word splits, timing rules and the schedule (features 5 and 6, as unit tests).
3. Reader with pasted text (features 1, 5, 6 and 7); the Finished card's numbers arrive with sessions in step 7.
4. Library and saved positions (feature 4).
5. EPUB import, then the built-in books (features 2 and 3).
6. Settings and the tuning screen (features 8 and 11).
7. Reading sessions and the backup file (features 10 and 9).
8. Install, offline and updates, About, and where to find books (features 12, 13 and 14).

A check that needs a later feature moves to that feature's issue: for example, feature 1's library check lands with feature 4, and feature 7's chapter-list check with feature 2.

## Open questions

- **Final timing values:** set after tuning on the iPhone (feature 11). The table in feature 6 holds starting values.
- **App icon and visual style:** not decided, apart from no Warner Bros. references.
- **Hosting:** decided: Cloudflare Pages, with a preview on its own origin for each PR. Why: [ADR 0006](docs/adr/0006-host-on-cloudflare-pages.md).
- **Paragraph pacer (after v1):** what moves (a word highlight, a line highlight or a sliding underline), how it scrolls on a phone (continuously or a screen at a time), and whether it shares the single-word speed.
- **Catalog (after v1):** a starter shelf, a curated list or search through a proxy; which copyright rule (the UK's 70 years, translators included, or 100 years); how to handle Gutenberg's license for texts the app serves; and where a proxy runs and how long it caches.
- **The next format after EPUB:** TXT or PDF.
