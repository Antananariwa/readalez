# Roadmap

Ideas for after v1, grouped by area; none is committed. When one is built, its entry moves into [SPEC.md](../SPEC.md) and leaves this file. Each entry has a title naming the idea, then **What** and, when known, **Others** (what other apps do, with sources), **Open** (what is undecided) and **Suggestions**.

## Settings

Idea: most reading settings could become adjustable, as some are in other speed-reading apps (each entry's **Others**).

### Sentence and paragraph pause sliders

- **What:** sliders in Settings for the sentence pause and the paragraph pause, applied on top of the defaults in [SPEC.md feature 6](../SPEC.md#6-timing). v1's [tuning screen](../SPEC.md#11-tuning-screen) already has a slider for every timing value, but it sets the defaults and isn't for readers. From the owner's first device trial (#36).
- **Others:** [Speeedy](https://github.com/sami-29/speeedy) scales its pauses by a sentence-pause and a paragraph-pause setting (`src/services/rsvp-engine.ts`). [mthiel74's SpeedReading](https://github.com/mthiel74/SpeedReading) toggles the sentence pause between 1.5× and 2×.

### Stop after a paragraph

- **What:** an option that pauses reading at the end of each paragraph (#36, #51).
- **Others:** [SplashReader](https://github.com/rattrayalex/splashreader)'s README says it "pauses every paragraph"; whether it waits for a tap isn't confirmed.
- **Open:** how reading goes on after the pause (a tap or a timer), and where play resumes ([feature 7](../SPEC.md#7-reader) resumes at the word on screen, which here is the paragraph's last word).

### Long-word settings

- **What:** an adjustable letter limit instead of the fixed 13, and showing numbers, email addresses and web addresses whole (smaller, or on two lines) instead of splitting them. Worth revisiting once v1's split ([feature 5](../SPEC.md#5-single-word-display)) is in use.

### Word chunks

- **What:** modes that show two or three words at a time, or that group short words such as "he was", chosen in Settings.
- **Others:** [Speeedy](https://github.com/sami-29/speeedy) has a Words per flash setting from 1 to 5 words, 1 by default (`chunkSize` in [`src/components/settings-panel.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/settings-panel.ts#L156-L166) and [`src/services/defaults.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/defaults.ts#L27)). With its `-m` switch, [speedread](https://github.com/pasky/speedread) joins two neighbouring words when each is 3 characters or fewer (`length($words[$i]) <= 3` in [`speedread`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L199-L207)).

## Reader

### Reader layout options

- **What:** settings for how the reader behaves and what it shows: where play resumes after a pause (the word on screen, as in v1, or the sentence start, as before #68), what shows while playing (progress bar, time left) and while paused (time left, how much text: the whole chapter, as in v1, or only the current sentence), what a tap on a word does (move there, as in v1, or also play on a second tap), where Back goes (the sentence's own start first, as in v1, or always the sentence before), and what's on screen at all. For example, a light mode with one sentence of context while paused and no times. Each setting defaults to v1's behaviour (SPEC.md feature 7). From the owner, reviewing #68.
- **Others:** [rsvp-speed-reader](https://github.com/valentinbayard/rsvp-speed-reader#readme) resumes from the sentence start by default, with a setting to turn it off, and plays a tapped word on a second tap. [RSVP-Lite](https://github.com/6packs/RSVP-Lite#readme) shows the surrounding paragraphs behind a "Text" toggle. [chriscantu/speed-reader](https://github.com/chriscantu/speed-reader#readme) shows the sentence on pause. All three READMEs were read for #68.
- **Open:** whether these are separate settings or a few presets, and whether any default should change once the settings exist.

### Warm-up when a book starts

- **What:** opening a book shows its whole title first. Tapping the frame then shows the first word for as long as a paragraph pause or longer, and the speed rises gradually from slower to the set speed. From the owner, reviewing #59.
- **Others:** [Speeedy](https://github.com/sami-29/speeedy)'s speed ramp is off by default. Turned on, it moves the speed from the set speed to a target speed, 500 wpm by default, over the text's first 30 words (`rampWpm` and `RAMP_WORDS` in [`src/services/rsvp-engine.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L735-L746), defaults in [`src/services/defaults.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/defaults.ts#L30-L31)).
- **Open:** whether the ramp runs only when a book opens or after every pause; the starting speed and over how many words it rises.
- **Suggestions:** the first word's time is already a timing value (the start factor, [SPEC.md feature 6](../SPEC.md#6-timing)), so a longer first word can be tried on the [tuning screen](../SPEC.md#11-tuning-screen) without new code. Chapter titles already show as words with the paragraph pause around them.

### Title above the frame while paused

- **What:** while paused, the book's title shows above the word frame, outside the reading area. A visual design choice, for when the visual style is decided ([SPEC.md, Open questions](../SPEC.md#open-questions)). From the owner, reviewing #59.

## Reading modes

### Paragraph pacer

- **What:** guided reading through full paragraphs, the second mode after single words. It builds on the paused view ([feature 7](../SPEC.md#7-reader)), and single-word timing comes first.
- **Open:** what moves (a word highlight, a line highlight or a sliding underline), how it scrolls on a phone (continuously or a screen at a time), and whether it shares the single-word speed.

## Books and formats

### Public-domain catalog and proxy

- **What:** finding and adding free books from inside the app. It needs a proxy, so v1 has readers import by hand and the built-in books cover a first use. A catalog has to respect Project Gutenberg's rules, quoted from its website's source ([`gutenbergtools/gutenbergsite`](https://github.com/gutenbergtools/gutenbergsite)): the website "is intended for human users only", and "any perceived use of automated tools" to access it results in "a temporary or permanent block of your IP address" ([terms of use](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/policy/terms_of_use.md?plain=1#L38)); many books are to be downloaded from its mirrors, not the main site ([terms of use](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/policy/terms_of_use.md?plain=1#L39)), and a database fed from its catalog files instead of crawling the site ([offline catalogs](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/ebooks/offline_catalogs.md?plain=1#L137)); and it follows US copyright law only ([permissions, "US only"](https://github.com/gutenbergtools/gutenbergsite/blob/80670c5250cb1d96719a22c1da164f1d09f7ad78/site/policy/permission.md?plain=1#L100-L101)). Its license rule is in [SPEC.md's Legal and licensing](../SPEC.md#legal-and-licensing). Cached copies sit in countries whose rules differ, so a proxy cache stays short-lived.
- **Open:** a starter shelf, a curated list or search through a proxy; which copyright rule (the UK's 70 years, translators included, or 100 years); how to handle Gutenberg's license for texts the app serves; and where a proxy runs and how long it caches.

### TXT, PDF, Word and other formats

- **What:** more import formats, one format per issue. TXT needs guesswork about line breaks and chapters, and text from PDFs is messy.
- **Open:** which comes after EPUB: TXT or PDF.

### Kindle formats (MOBI, AZW, KFX)

- **What:** importing Amazon Kindle's file formats. v1 imports EPUB only ([SPEC.md feature 2](../SPEC.md#2-import-epub-files)). The owner's idea for later (#97).
- **Open:** whether it's worth it, since books bought in Kindle's store are usually copy-protected (not checked), which would leave only DRM-free Kindle files.

## Progress and stats

### Stats screens

- **What:** screens for reading history, speed and time read. Sessions are recorded from v1 ([feature 10](../SPEC.md#10-reading-sessions)).

## Platforms

### Android store app

- **What:** an Android app through Capacitor ([ADR 0002](adr/0002-pwa-in-typescript-and-react.md)). [SPEC.md](../SPEC.md#devices-and-browsers) supports the PWA itself in Android Chrome; a store app stays an idea.

## Extras

### Features other apps have

- **What:** per-book speed, training plans, comprehension quizzes, sounds and text-to-speech, "bionic" reading, dyslexia fonts and colour overlays. Each one is a separate idea. Speed ramps: [Warm-up when a book starts](#warm-up-when-a-book-starts).
