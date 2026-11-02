# Known limitations

Known problems, limits and edge cases that are accepted for now: what happens, why it was left, and what would fix it. Addressing any of them is optional. Undecided product questions live in SPEC.md's Open questions, decisions in docs/adr/, and bugs that must be fixed in GitHub issues.

When a PR accepts a limitation, it adds an entry here. When a PR fixes one, it removes the entry.

## Timing and sentences

Code: `src/core/sentences.ts`. Tests: `src/core/sentences.test.ts`. Added in #7.

### Abbreviations that often end a sentence get a sentence pause

- **What happens:** `etc.`, German `usw.`, Polish `itd.`, Polish `r.` and Russian `г.` after a year ("w 1990 r.") always end a sentence. So "apples, pears, etc. and more" pauses after `etc.`, and back and forward treat the rest as a new sentence.
- **Why:** SPEC.md feature 6 says a known abbreviation ends a sentence only as the last word of a paragraph. If these were on the list, a sentence that really ends with them would merge with the next one. A wrong pause costs less than a merged sentence.
- **Possible fix:** let a listed abbreviation end a sentence when the next word starts with a capital letter, as established sentence splitters do (NLTK's Punkt, pySBD). That changes SPEC.md feature 6's rule, so it's the owner's call.

### Common words that look like abbreviations are left off the list

- **What happens:** `ok.`, Polish `im.` and Russian `им.` ("them") always end a sentence, so their abbreviation meanings (Polish `ok.` for "about", `im.` and `им.` for "named after") get a sentence pause. English `ex.` (as in "my ex.") is on the list for French `p. ex.`, so it never ends a sentence.
- **Why:** each word has two meanings, and the abbreviation rule can't tell which one is meant.
- **Possible fix:** same as above, using the next word's capital letter.

### A sentence ending in a single capital letter gets no sentence pause

- **What happens:** a capital letter followed by a dot counts as an initial (`J. R. R.`), so "It was plan A. Then B came." has no pause after `A.` and no sentence start at `Then`. This also affects appendix letters, vitamins and Roman numerals. `I.` is the one exception, as in "It was I."
- **Why:** initials are far more common in books than sentences ending in a single capital.
- **Possible fix:** the next word's capital letter, as above.

### German ordinals get a sentence pause

- **What happens:** `am 3. Oktober` pauses after `3.`, and back and forward see a new sentence at `Oktober`.
- **Why:** the decimals rule covers `3.14` only. A number followed by a dot usually ends an English sentence ("in 1914.").
- **Possible fix:** treat a number with a dot as an ordinal when the next word is a month or starts with a lowercase letter, in German text only. That needs the text's language.

## Schedule

Code: `src/core/schedule.ts`. Added in #7.

### After a stall, one word can show for less than its time

- **What happens:** when the device stalls (for example for 250 ms) and the next word's scheduled end is still ahead, that word shows only until its scheduled end, sometimes for a single frame. The schedule is back on time after that word.
- **Why:** keeping the schedule fixed is what stops drift. Starting a new schedule after every late frame would add up delays.
- **Possible fix:** start a new schedule whenever the next word would get less than half its time. At 1,000 wpm at 30 Hz, normal frames would then trigger it too, and reading would run slightly slow.

### Time left leaves out the pause after play

- **What happens:** the first word after play or a jump shows for at least 3×, but time left counts it at its usual time. Time left is up to 2 ordinary words short each time you press play.
- **Why:** time left stays the same whether you're paused or playing.
- **Possible fix:** add the start factor to time left while paused.
