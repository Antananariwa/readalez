# Roadmap

Ideas for after v1, grouped by area; none is committed. When one is built, its entry moves into [SPEC.md](../SPEC.md) and leaves this file. Each entry has a title naming the idea, then **What** and, when known, **Others** (what other apps do, with sources), **Open** (what is undecided) and **Suggestions**.

## Settings

Idea: most reading settings could become adjustable, as in other speed-reading apps.

### Sentence and paragraph pause sliders

- **What:** sliders in Settings for the sentence pause and the paragraph pause, applied on top of the defaults in [SPEC.md feature 6](../SPEC.md#6-timing). v1's [tuning screen](../SPEC.md#11-tuning-screen) already has a slider for every timing value, but it sets the defaults and isn't for readers. From the owner's first device trial (#36).
- **Others:** [Speeedy](https://github.com/sami-29/speeedy) scales its pauses by a sentence-pause and a paragraph-pause setting (`src/services/rsvp-engine.ts`). [mthiel74's SpeedReading](https://github.com/mthiel74/SpeedReading) toggles the sentence pause between 1.5× and 2×.

### Stop after a paragraph

- **What:** an option that pauses reading at the end of each paragraph (#36, #51).
- **Others:** [SplashReader](https://github.com/rattrayalex/splashreader)'s README says it "pauses every paragraph"; whether it waits for a tap isn't confirmed.
- **Open:** how reading goes on after the pause (a tap or a timer), and where play resumes ([feature 7](../SPEC.md#7-reader) resumes at the sentence start, which here is the next paragraph's first word).

### Long-word settings

- **What:** an adjustable letter limit instead of the fixed 13, and showing numbers, email addresses and web addresses whole (smaller, or on two lines) instead of splitting them. Worth revisiting once v1's split ([feature 5](../SPEC.md#5-single-word-display)) is in use.

### Word chunks

- **What:** modes that show two or three words at a time, or that group short words such as "he was", chosen in Settings.
- **Others:** [Speeedy](https://github.com/sami-29/speeedy) has a Words per flash setting from 1 to 5 words, 1 by default (`chunkSize` in [`src/components/settings-panel.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/components/settings-panel.ts#L156-L166) and [`src/services/defaults.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/defaults.ts#L27)). With its `-m` switch, [speedread](https://github.com/pasky/speedread) joins two neighbouring words when each is 3 characters or fewer (`length($words[$i]) <= 3` in [`speedread`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L199-L207)).

## Reading modes

### Paragraph pacer

- **What:** guided reading through full paragraphs, the second mode after single words. It builds on the paused view ([feature 7](../SPEC.md#7-reader)), and single-word timing comes first.
- **Open:** what moves (a word highlight, a line highlight or a sliding underline), how it scrolls on a phone (continuously or a screen at a time), and whether it shares the single-word speed.

## Books and formats

### Public-domain catalog and proxy

- **What:** finding and adding free books from inside the app. It needs a proxy, Gutenberg blocks automated traffic, and copyright differs by country, so v1 has readers import by hand and the built-in books cover a first use. [SPEC.md's Legal and licensing](../SPEC.md#legal-and-licensing) lists what a catalog has to respect.
- **Open:** a starter shelf, a curated list or search through a proxy; which copyright rule (the UK's 70 years, translators included, or 100 years); how to handle Gutenberg's license for texts the app serves; and where a proxy runs and how long it caches.

### TXT, PDF, Word and other formats

- **What:** more import formats, one format per issue. TXT needs guesswork about line breaks and chapters, and text from PDFs is messy.
- **Open:** which comes after EPUB: TXT or PDF.

## Progress and stats

### Stats screens

- **What:** screens for reading history, speed and time read. Sessions are recorded from v1 ([feature 10](../SPEC.md#10-reading-sessions)), so stats start with a history.

## Platforms

### Android store app

- **What:** an Android app through Capacitor ([ADR 0002](adr/0002-pwa-in-typescript-and-react.md)).

## Extras

### Features other apps have

- **What:** per-book speed, speed ramps and training plans, comprehension quizzes, sounds and text-to-speech, "bionic" reading, dyslexia fonts and colour overlays. Each one is a separate idea.
- **Others:** [Speeedy](https://github.com/sami-29/speeedy)'s speed ramp is off by default. Turned on, it moves the speed from the set speed to a target speed, 500 wpm by default, over the text's first 30 words (`rampWpm` and `RAMP_WORDS` in [`src/services/rsvp-engine.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L735-L746), defaults in [`src/services/defaults.ts`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/defaults.ts#L30-L31)).
