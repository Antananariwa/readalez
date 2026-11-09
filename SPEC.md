# Spec

What Readalez does and why. Each feature issue links the feature it builds, whose checks below are its acceptance criteria, and adds only what is specific to the issue: which part of the feature it covers, its open questions and any extra checks. Each check says where it runs (see [How features are checked](#how-features-are-checked)). The reasons behind technical choices live in [docs/adr](docs/adr/). It's an educated guess: thought through, but not assumed always true, and corrected as Readalez grows and meets real books, devices and readers.

## What Readalez is

A free, open-source speed-reading web app for practicing on real, meaningful texts. v1 shows one word at a time with a highlighted focus letter; guided reading through full paragraphs comes later. It's a PWA (ADR 0002), so it installs from the browser on iPhone and desktop.

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
- **Desktop:** current Chrome, Edge and Firefox. Chrome and Edge can install the app; Firefox runs it in a tab. Why: together they cover most desktop users (#44).
- **Not checked in v1:** Safari on Mac, Android Chrome and iPad. They run the same engines and will likely work, but nobody checks them. Why: every checked browser adds a manual check per release. An Android store app through Capacitor comes later (ADR 0002).
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
- **Reading starts where the author's text starts** the first time a book opens. Publishing paperwork stays out of the reading flow: the cover, title and half-title pages, copyright and imprint pages, contents pages, lists of illustrations, pages left empty once images are dropped (such as a frontispiece) and Gutenberg's license pages. Everything the author wrote stays in, from dedications, epigraphs and prefaces to afterwords and appendices; a preface counts even when the book's markup places the main text after it, as Standard Ebooks does. Sections are recognised from the book's markup (EPUB 3 semantics or the EPUB 2 guide), then from Gutenberg's markers and section titles. Why: you open a book to read it, not its paperwork.
- **The reading flow ends with the author's last words**, where the Finished card shows (feature 7). Back-matter paperwork (colophons, copyright pages, Gutenberg's closing license) comes after it. Why: finishing a book shouldn't mean reading its license.
- **Everything skipped stays reachable** from the chapter list. Playing a skipped section reads it to its end and stops there.
- **Notes.** Note markers (¹, [12], * and other links to notes) never appear in the word stream. The notes themselves stay out of the reading flow and can be reached from the chapter list. Why: a marker flashing as its own word breaks the flow.
- **Kept:** headings, paragraphs, block quotes, list items and table rows (each one a paragraph), and line breaks in verse (each gets a pause, see feature 6). **Dropped:** images, with their alt text and captions, since they describe pictures that aren't shown. Soft hyphens and zero-width characters are removed, and non-breaking spaces read as spaces.
- **Title and author** come from the book's metadata, falling back to the file name and "Unknown author".
- **Copy-protected books** (Kindle, Apple Books and Adobe DRM) show "This book is copy-protected (DRM), so Readalez can't open it." Fonts scrambled for licensing (EPUB font obfuscation) are not DRM, and those books open.
- **Errors.** A file that isn't a readable EPUB shows a clear message, and nothing half-imported appears in the library.
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
- Device: a 600,000-word EPUB (about the length of _War and Peace_) imports on the owner's iPhone, showing progress, and the app stays responsive.

### 3. Built-in books

Three books are always in the library:

- _A Christmas Carol_ by Charles Dickens
- _Alice's Adventures in Wonderland_ by Lewis Carroll
- _The Strange Case of Dr Jekyll and Mr Hyde_ by Robert Louis Stevenson

Each is a short book, a couple of hours at 300 wpm. Why: so a new reader can try the app at once without fetching a book; the owner gets real books for tuning, and they double as test fixtures for EPUB import. Short books keep the download small.

- **Editions:** Standard Ebooks, with the images, the frontispiece page and the list of illustrations removed. Why: proofread, cleanly marked-up EPUB 3, and their own work is dedicated to the public domain (CC0, in each book's `src/epub/text/uncopyright.xhtml`, for example [_A Christmas Carol_'s](https://github.com/standardebooks/charles-dickens_a-christmas-carol/blob/fbcca8acb37169bbb560b8796c1f05b0240f6792/src/epub/text/uncopyright.xhtml)), so there's no license text to carry. Their sources are on GitHub (for example `standardebooks/charles-dickens_a-christmas-carol`), which the dev container can reach.
- **Copyright:** all three are public domain (see [Legal and licensing](#legal-and-licensing)).
- **Permanent:** they can't be deleted or renamed. Their progress works like any book's, and Delete all data resets it. Why: so there's always something to read and to tune with.
- **One code path:** they ship as EPUB files and go through the same import as the reader's own books.
- **Offline:** they work without a network after the first visit.
- **Backups** hold their progress, not their text.

Checks:

- E2E: a fresh install lists the three books, and each opens where its author's text starts (feature 2).
- E2E: built-in books can't be deleted; after Delete all data they're still listed, at 0%.
- E2E: after the first visit, with the network off, a built-in book opens and plays.
- Unit: the three shipped EPUBs contain no images.

### 4. Library

The app's home screen: every book, built-in or your own, most recently opened first and unopened books last, so the book you're reading is on top. Each shows its title, author, progress, time left at the current speed and when it was last opened. Tapping a book opens it where you left off (feature 7 says where reading resumes). Your own books (pasted or imported) can be renamed and deleted, with a confirmation.

- **Progress is saved while you read:** on pause and at each move while paused, when you leave the reader, when the app goes to the background, and every 2 seconds while playing. Why: iOS can close a web app in the background without warning; 2 seconds leaves room within the 5 seconds the device check below allows for a write still in flight and a late timer.
- **Progress and time left** measure the reading flow (feature 2): 0% at its first word and 100% at the Finished card. A position in a skipped section counts as 0% before the flow and 100% after it.
- **Positions survive updates.** A position is stored by chapter, paragraph and word, so when a later version splits words differently, you land in the same paragraph. Why: the splitting rules will change as timing gets tuned. How it's stored: ADR 0008.
- **Finished books** show "Finished" in the library in place of progress and time left, and open on their Finished card (feature 7). Why: a book opens where you left off, and the card offers Start over.

Checks:

- E2E: the library shows the title, author, progress, time left and last opened date of each book, sorted by last opened.
- E2E: renaming one of your own books and deleting another both survive a reload.
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
- **Navigation.** A chapter list, including the skipped front matter, the notes and the publishing pages; tapping an entry jumps to its start. A draggable progress bar covers the reading flow, and letting go moves to the start of the nearest sentence. Time left shows for the chapter and the book, in minutes and seconds (`h:mm:ss` from an hour). The bar stays on screen while playing, dimmed and locked, so it can be dragged only while paused; time left shows only while paused. Why: seconds, because [feature 6's device check](#6-timing) compares a chapter's time left with a stopwatch to within 2%; hidden while playing, because the times took too much attention from the words (the owner, reviewing #68); the bar locked while playing, because a drag then moved the place mid-reading (the owner, testing #75).
- **Finished card.** After the last word of the last chapter, a card shows the book's word count, your total reading time for it and your real average speed, and the book is marked finished. The card offers Back to library and Start over; Start over goes back to the first word, paused, and the book is no longer marked finished. The keys do nothing while the card shows. The word count counts runs of text between spaces, so "yes—no" is one word. Why: the simplest count; it doesn't need to match the words shown exactly (the owner, reviewing #68).
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

- **Install.** Add to Home Screen in iPhone Safari, or the install button in Chrome and Edge, gives a full-screen app named Readalez with its own icon. Firefox runs it in a tab.
- **Offline.** After the first visit, the app, the built-in books and your own books work without a network.
- **Updates** download in the background and apply at a later launch, never while you read.
- **Install tip.** On the first visit in iPhone Safari (not in the installed app), a card explains that Safari and the installed app keep separate libraries, and that Safari deletes a site's script-writable storage after seven days of Safari use without interaction with the site ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)); it shows the Add to Home Screen steps. Once dismissed, it doesn't return. Why: books added in a Safari tab don't appear in the installed app, and the installed app is exempt from the seven-day clearing (not checked).
- **Keep the data.** The app asks the browser for persistent storage; when it asks is #22's choice. Why: a browser that grants it doesn't clear the data to free space.

Checks:

- E2E: after one visit, the app reloads with the network off, and a built-in book plays.
- E2E: a new version deployed while a book is playing doesn't reload the page, and a later launch runs it.
- E2E: the install tip shows once in emulated iPhone Safari (not installed) and never in other browsers.
- E2E: once a book is saved, the app has requested persistent storage.
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

A short help note on the Add text screen. It links to Project Gutenberg and Standard Ebooks and gives the steps: on iPhone, download the EPUB in Safari (it lands in Files, under Downloads), then Add text, Import EPUB; on desktop, download, then import. It adds that copyright laws differ between countries and asks readers to check their local laws before reading a book. Why: Readalez itself doesn't check a book's copyright ([known issue](docs/known-issues.md#readalez-doesnt-check-whether-a-book-is-free-to-read-where-you-live)). Why: there's no catalog in v1, so readers need the way to free books.

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
- **Project Gutenberg.** Its name stays out of the app's name. In v1 the app only links to Gutenberg and leaves Gutenberg's license pages out of the reading flow of books readers import for themselves (feature 2). A text that keeps the Project Gutenberg name must carry its license, while one stripped of every Gutenberg mention is a plain public-domain text (not checked), so the Gutenberg test fixtures keep their license pages. A later catalog has more of Gutenberg's rules to respect: [docs/roadmap.md](docs/roadmap.md#public-domain-catalog-and-proxy).
- **Focus-point patents.** The fixed focus point in feature 5 is what Spritz's patents describe: US 8,903,174 ("Serial text display for optimal recognition apparatus and method", filed 2012; Google Patents lists it as active, which isn't verified), the related US 9,483,109 and US 10,332,313, and a European family member (validated in Spain as ES 2700224 T3, so UK coverage is possible). The Chinese and Japanese members have lapsed. Free apps use the design openly (the open-source readers in [feature 5](#5-single-word-display)), and the risk is low for a free open-source app. Recheck before charging money, and keep "Spritz" out of the name and the app's text.
- **Name.** See [What Readalez is](#what-readalez-is).
- **Privacy.** With no accounts, analytics, cookies, ads, logging or server of its own, Readalez collects no personal data. Storage on the device holds only what the features a reader uses need, which the UK's rules on device storage (PECR) treat as strictly necessary, so no consent banner is needed. Adding a server, sync or analytics means revisiting UK GDPR first.
- **Licenses.** Readalez is MIT. Dependencies stay permissive, and their notices ship in the app (feature 13). Code copied or adapted from Speeedy (`sami-29/speeedy`, MIT) keeps its copyright notice. Its test fixtures are never copied: one of them is a copyrighted book ([`test-fixtures/01-11-2020-212827The 7 Habits of Highly Effective People.pdf`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/test-fixtures/01-11-2020-212827The%207%20Habits%20of%20Highly%20Effective%20People.pdf)). The Standard Ebooks editions are credited as a courtesy; their license is under [Built-in books](#3-built-in-books).

## How features are checked

- **Unit:** unit tests run by `npm run check`, mostly in `src/core`, where reading rules are tested exactly and quickly (ADR 0003). The Stop hook runs them.
- **E2E:** Playwright in the dev container, in headless Chromium and in WebKit with iPhone emulation, including screenshots and measurements. Why WebKit, and why the Device checks stay: ADR 0005.
- **Build:** a check that runs as part of the build.
- **Review:** checked by reading the diff. Each merged PR's review is collected in [docs/reviews.md](docs/reviews.md), to show what the reviews catch.
- **Device:** the owner on the iPhone (installed app, iOS 18.4 or later) and in desktop Chrome, Edge and Firefox. Each PR's How to test lists them.
- **Speed and size targets** are in #73, to be researched near the end of v1 (the owner, reviewing #72).
- **Test fixtures** follow the copyright rule in [Legal and licensing](#legal-and-licensing).

## Build order

Each open issue names the issues it builds on. A check that needs a later feature moves to that feature's issue: for example, feature 7's chapter-list check lands with feature 2's reading flow (#15).

## Open questions

- **Final timing values:** set after tuning on the iPhone (feature 11). The table in feature 6 holds starting values.
- **App icon and visual style:** not decided, apart from no Warner Bros. references.
- **What a chapter is,** for the paused view and chapter time left. Today it's one spine item (ADR 0009), and in Gutenberg's _Moby Dick_ 135 chapters sit in 11 spine items ([fixtures](tests/fixtures/epub/README.md)). #15 settles it.
