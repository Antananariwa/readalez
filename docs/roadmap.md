# Roadmap

Ideas for after v1. None is committed, and a built idea moves into [SPEC.md](../SPEC.md) and leaves this file. Entries take four of the [Rust RFC template](https://github.com/rust-lang/rfcs/blob/master/0000-template.md)'s headings. Sections follow SPEC.md's v1 features. A title names the idea, then:

- **Summary:** what the idea is.
- **Motivation:** the problem it solves.
- **Prior art:** what other apps do, with sources, when known.
- **Unresolved questions:** what is undecided, when known.

## Import

### TXT, PDF, Word and other formats

- **Summary:** importing more file formats, one per issue: TXT, PDF, Word, and Kindle's MOBI, AZW and KFX.
- **Motivation:** a plain-text book can only be pasted, and pasted text has no chapters ([SPEC.md feature 1](../SPEC.md#1-add-text-by-pasting)). A TXT import would guess them. For the other formats, no reason recorded.
- **Unresolved questions:**
  - Which comes first: TXT or PDF.
  - Whether Kindle formats are worth it, since Kindle's store books usually carry DRM (not checked).

## Library

### Library filters and search

- **Summary:** filtering the library by genre or author, and searching it, beyond v1's library filters ([SPEC.md feature 4](../SPEC.md#4-library)). The built-in books' catalog already holds genres (`src/core/builtInBooks.ts`).
- **Motivation:** more books make finding one harder, and the built-in books alone number 24.
- **Prior art:** Play Books filters its library by genre, author, progress and more ([Google Play Help](https://support.google.com/googleplay/answer/9402600)).
- **Unresolved questions:** how many books make filters or search worth it, and whether own books get genres.

## Single-word display

### Long-word settings

- **Summary:** an adjustable letter limit instead of the fixed 13 ([SPEC.md feature 5](../SPEC.md#5-single-word-display)), and numbers, email addresses and web addresses shown whole, smaller or on two lines. #30 discusses it.
- **Motivation:** a split number is hard to read: `splitLongWord` (`src/core/longWords.ts`) shows `1,000,000,000,000,000,000` as `1,000,000,000-`, then `,000,000,000`. A reader takes in a long number as one shape (#30).
- **Unresolved questions:** which options Settings offers; on two lines, where the focus letter sits and how the word is timed; and the smallest text size before a word is split after all.

### Word groups

- **Summary:** showing two or three words at a time, or joining short words such as "he was" into one flash, chosen in Settings. #31 discusses it.
- **Motivation:** short words flashed one by one feel choppy (#31).
- **Prior art:** [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/settings-panel.ts#L156-L166) has a setting for 1 to 5 words per flash. [speedread](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L199-L207)'s `-m` switch joins two neighbouring words of 3 characters or fewer.
- **Unresolved questions:** where a group's focus letter sits, how it's timed, and whether it crosses a sentence end.

## Timing

### Sentence and paragraph pause sliders

- **Summary:** sliders in Settings for the sentence pause and the paragraph pause ([SPEC.md feature 6](../SPEC.md#6-timing)). The [tuning screen](../SPEC.md#11-tuning-screen) sets the defaults; these would be for readers.
- **Motivation:** pauses are judged by feel: at 3×, a sentence end felt like a stop at every sentence (#36). Timing can feel different to each reader, and speed is v1's only timing setting ([SPEC.md feature 8](../SPEC.md#8-settings)).
- **Prior art:** [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/settings-panel.ts#L174-L194) has both sliders.

### Stop after a paragraph

- **Summary:** an option that pauses reading at the end of each paragraph.
- **Motivation:** a stop gives the eyes a break, and time to blink. The paragraph pause gives only part of that ([SPEC.md feature 6](../SPEC.md#6-timing)).
- **Prior art:** [SplashReader](https://github.com/rattrayalex/splashreader/blob/9434066baac9c56b646c248bda7f1b81b18bdd90/src/index.js#L93-L104) pauses for 1 second at each new paragraph, then goes on by itself.
- **Unresolved questions:** whether a tap or a timer restarts reading, and whether play then resumes at the paragraph's last word, the word on screen ([SPEC.md feature 7](../SPEC.md#7-reader)).

### Warm-up when a book starts

- **Summary:** opening a book shows its whole title first. Play then shows the first word for at least a paragraph pause, and the speed rises from slower to the base speed.
- **Motivation:** No reason recorded.
- **Prior art:** [Speeedy](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L735-L746)'s optional speed ramp moves from the set speed to a target speed over the first 30 words.
- **Unresolved questions:** whether the ramp runs only when a book opens or after every pause, its starting speed, and its length.

## Reader

### Reader layout options

- **Summary:** settings for how the reader behaves and what it shows, each with a choice besides v1's ([SPEC.md feature 7](../SPEC.md#7-reader)): play resumes at the sentence start; previous sentence always goes to the sentence before; a second tap on a word in the paused view plays; the paused view shows only the current sentence; the reader shows no progress bar or time left.
- **Motivation:** layout can feel different to each reader, and v1's reader has one layout.
- **Prior art:** [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader/blob/3e27123cebbcdee7b3988ddbe05ea52858f44a2c/README.md?plain=1#L23-L24) plays a tapped word on a second tap, and can resume at the sentence start.
- **Unresolved questions:** whether these are separate settings or a few presets, and the defaults for where play resumes and where previous sentence goes.

### Paragraph pacer

- **Summary:** a second reading mode: guided reading through full paragraphs, built on the paused view ([SPEC.md feature 7](../SPEC.md#7-reader)).
- **Motivation:** No reason recorded.
- **Unresolved questions:** what moves (a word highlight, a line highlight or a sliding underline), how it scrolls on a phone, and whether it shares the single-word speed.

## Reading sessions

### Stats screens

- **Summary:** screens for reading history, speed and time read, from the reading sessions v1 records ([SPEC.md feature 10](../SPEC.md#10-reading-sessions)).
- **Motivation:** No reason recorded.

## Install

### Android store app

- **Summary:** an Android app in an app store, built from the same code with Capacitor ([ADR 0002](adr/0002-pwa-in-typescript-and-react.md)). SPEC.md already supports the installed app in Android Chrome ([SPEC.md, Android](../SPEC.md#android)).
- **Motivation:** No reason recorded.

## Where to find books

### Public-domain catalog and proxy

- **Summary:** finding and adding free books from inside the app.
- **Motivation:** in v1, a reader leaves the app to find a free book, downloads it, then imports it ([SPEC.md feature 14](../SPEC.md#14-where-to-find-books)).
- **Unresolved questions:**
  - A starter shelf, a curated list or search through a proxy.
  - Which copyright rule: the UK's 70 years, translators included, or 100 years. Project Gutenberg follows US copyright only ([permissions](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/policy/permission.md?plain=1#L100-L101)).
  - How to meet Gutenberg's terms. Its site is "for human users only" ([terms of use](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/policy/terms_of_use.md?plain=1#L38)). It asks for a database fed from its catalog files, not crawling ([offline catalogs](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/ebooks/offline_catalogs.md?plain=1#L137)).
  - Where a proxy runs, since v1 has no server of its own ([SPEC.md](../SPEC.md#everything-stays-on-the-device)), and how long it caches, since cached copies sit in countries whose copyright rules differ.
