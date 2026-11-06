# 8. Store reading positions on the book's library entry, with its progress

Date: 2026-11-06
Status: Accepted

## Context

Issue #13 saves where reading stopped, at every pause, move, page hide and every 2 seconds while playing (SPEC.md feature 4), and the library shows each book's progress and time left at the current speed. ADR 0007 keeps each book's `BookInfo` in the `books` store and its sections in `texts`, so the library lists books without loading their texts. Time left comes from each word's duration, which needs the text split into words and timed: `splitText` took 1.3 s of a Node run on a 1 MB text (ADR 0007). The splitting rules will change as timing gets tuned, and a saved position must still land in the same paragraph (SPEC.md feature 4).

## Decision

- **Where:** a `reading` field on the book's `BookInfo` in the `books` store (`src/core/library.ts`, `Reading` in `src/core/position.ts`), written by `saveReading` in `src/ui/storage.ts`. Not a store of its own: there is one position per book, it's read whenever the book is listed, and the backup merge (#21) compares it per book. The field is optional and no store or index changes, so the database stays at version 1; books stored before #13 have no `reading` until they're read.
- **The position** is the section, paragraph and word indices that `Word` already carries (`Position`). `findPosition` finds it again in a fresh split: within the same paragraph, a word index past the paragraph's end becomes its last word. Paragraph indices count paragraphs that show no words, and texts are stored parsed (ADR 0007), so paragraphs keep their indices across versions.
- **Progress is stored with it,** worked out when the position is saved, so the library needn't split any text: `progress` (the word's index over the word count, 1 at the Finished card), `finished`, and `left`, the remaining words counted by timing factor (`[factor, count]` pairs, 8 distinct factors in the Jekyll and Hyde fixture). Time left at any speed is then the sum of count × the factor's rounded duration (`bookTimeLeft`), which equals `timeLeft` from that word exactly, since `wordDuration` rounds each word the same way (`src/core/position.test.ts`). A single number, such as the time left in milliseconds or the sum of the factors, would follow a change of speed only approximately.
- **Saving cost:** `progressTable` gives each word a small factor id once per open, so each save is one pass over those ids from the word to the end. On a 481,400-word text (200 copies of the Jekyll and Hyde fixture), building the table took 7 ms and each save 0.7 to 1.4 ms in Node on the dev container (#13's PR). iPhone times are unknown; performance targets are in #73.

## Consequences

- After an update that changes the splitting or timing rules, the library shows the progress and time left from the last save until the book is opened again (docs/known-issues.md).
- Every save rewrites the whole `BookInfo` record, which is small: title, author, dates and at most a few dozen numbers.
- Backups (#21) carry `reading` as stored; "the position from whichever device read it last wins" needs a time of the last save, which `openedAt` approximates. #21 decides whether to add one.
