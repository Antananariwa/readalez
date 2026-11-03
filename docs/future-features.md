# Future features

Features and ideas planned for after v1, grouped by area, so they're easy to find and plan around. What v1 builds lives in SPEC.md; what v1 leaves out for good is in SPEC.md's Out of scope; known problems are in docs/known-issues.md; undecided questions are in SPEC.md's Open questions.

Each entry says what it is, why it waits, and what others do where that's known. An entry here is not a commitment: building one is a feature change, so the owner agrees first (CLAUDE.md). When one is built, its entry moves into SPEC.md and leaves this file.

## Settings: making reading adjustable

Most of how reading feels should be adjustable. Why: the owner's choice; timing and layout feel different to each reader.

### Sentence and paragraph pause sliders

- **What:** sliders in Settings for the sentence pause and the paragraph pause, applied on top of the defaults in SPEC.md feature 6.
- **Why later:** v1 has a tuning screen with a slider for every timing value (feature 11), reached through Settings, About, Tuning. It's for setting the defaults, not for readers. These two would be the reader-facing part of it.
- **Others:** Speeedy has a sentence-pause and a paragraph-pause setting. mthiel74's SpeedReading toggles the sentence pause between 1.5× and 2×.
- **Added:** after the owner's first device trial (#36).

### Stop after a paragraph or a chapter

- **What:** a toggle that pauses reading at the end of each paragraph, or of each chapter, until you tap to go on. Within the unit, reading stays automatic. Stopping after a chapter is likely the more useful of the two for most readers.
- **Why:** a break for the eyes, and blinking; a longer paragraph pause (#36) only partly gives that.
- **Others:** SplashReader "pauses every paragraph"; whether it waits for a tap isn't confirmed.
- **Open:** whether it's one setting with three choices (never, after a paragraph, after a chapter) and where play resumes (feature 7 resumes at the sentence start, which here is the next paragraph's first word).
- **Added:** after the owner's first device trial (#36).

### Long-word settings

- **What:** an adjustable letter limit instead of the fixed 13, and showing numbers, email addresses and web addresses whole (smaller, or on two lines) instead of splitting them.
- **Why later:** v1's split (SPEC.md feature 5) works, and a reader takes in a big number as one shape, so this is worth revisiting once the reader is in use.

### Word chunks

- **What:** modes that show two or three words at a time, or that group short words such as "he was", chosen in Settings.
- **Others:** Speeedy has a words-per-flash setting; speedread joins neighbouring words of 3 letters or fewer.

## Reading modes

### Paragraph pacer

- **What:** guided reading through full paragraphs, the second mode after single words.
- **Why later:** it's fiddly on a phone, single-word timing comes first, and the paused view (SPEC.md feature 7) is its base.
- **Open:** see SPEC.md's Open questions (what moves, how it scrolls, whether it shares the single-word speed).

## Books and formats

### Public-domain catalog and proxy

- **What:** finding and adding free books from inside the app.
- **Why later:** importing by hand avoids running a proxy, Gutenberg's blocking of automated traffic and copyright filtering by country, and the built-in books cover a reader's first use. SPEC.md's Legal and licensing lists what a catalog has to respect; its Open questions list what's undecided.

### TXT, PDF, Word and other formats

- **What:** more import formats, one format per issue.
- **Why later:** TXT needs guesswork about line breaks and chapters, and text from PDFs is messy. Which comes after EPUB is an open question in SPEC.md.

## Progress and stats

### Stats screens

- **What:** screens for reading history, speed and time read.
- **Why later:** sessions are recorded from v1 (SPEC.md feature 10), so stats start with a history.

## Platforms

### Android store app

- **What:** an Android app through Capacitor (ADR 0002).

## Extras other apps have

Each one is a separate product decision: per-book speed, speed ramps and training plans, comprehension quizzes, sounds and text-to-speech, "bionic" reading, dyslexia fonts and colour overlays. Speeedy ramps the speed up over the first 30 words.
