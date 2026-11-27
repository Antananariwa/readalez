# 8. Store reading positions on the book's library entry, with its progress

Date: 2026-11-06
Status: Accepted

## Context

- The app saves a book's position often ([SPEC.md feature 4, Saving progress](../../SPEC.md#saving-progress)).
- The library shows each book's progress and time left, both over the reading flow ([SPEC.md feature 4, Progress and time left](../../SPEC.md#progress-and-time-left)). Time left comes from each word's duration. That needs the text split into words and timed, and splitting is the slow part of a save (ADR 0007).
- A saved position must survive changes to the splitting rules ([SPEC.md feature 4, Positions survive updates](../../SPEC.md#positions-survive-updates)).
- The backup file merges positions per book ([SPEC.md feature 9, Import](../../SPEC.md#import)).

Options considered:

- **Where:** a store of its own, or a field on the book's `BookInfo` in the `books` store (ADR 0007).
- **Progress:** worked out each time the library shows, which means splitting every text; or stored with the position. Stored, it could be a single number, such as the time left in milliseconds, or the words left counted by timing factor.

## Decision

- **Where:** a `reading` field on the book's `BookInfo` holds it (`Reading` in `src/core/position.ts`), and `saveReading` in `src/ui/storage.ts` writes it. A book has one position, which the library reads with the book, and the backup file's merge compares it per book. The field is optional, so the stores don't change.
- **The position** is the section, paragraph and word indices that `Word` carries (`Position`). `findPosition` finds it again in a fresh split, in the same paragraph. The library stores the text parsed (ADR 0019), so paragraphs keep their indices across versions.
- **The app stores progress with the position,** and works it out at each save, so the library splits no text. The fields are `progress`, `finished` and `left`.
  - `left` counts the reading flow's remaining words by timing factor, as `[factor, count]` pairs.
  - Time left at any speed is then the sum of count × the factor's rounded duration (`bookTimeLeft`). This equals `timeLeft` from that word exactly, since `wordDuration` rounds each word the same way (`src/core/position.test.ts`).
- The other options lose:
  - A store of its own would make the library read two stores and match them by ID, to spare a rewrite of a small record at each save.
  - Progress worked out at each showing would split every text in the library.
  - A single number would follow a change of speed only approximately.

## Consequences

- Each save rewrites the book's whole `BookInfo` record. The record holds a few strings and dates, the position, and `left`, with one pair per timing factor among the words left.
- On 2026-11-06, in Node on the dev container, a 481,400-word text took 7 ms to prepare at open, and each save 0.7 to 1.4 ms (`progressTable`, PR #75).
- After an update that changes the splitting or timing rules, the library shows the progress and time left from the last save until the reader opens the book again ([known issue](../known-issues.md#progress-in-the-library-can-be-out-of-date-after-an-update)).
- In a merge, "the position from whichever device read it last wins" (SPEC.md feature 9). That needs the time of the last save, which `openedAt` only approximates. #21 decides whether to add one.
