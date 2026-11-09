# 11. Store the reading flow with the text, gather notes into one section, and take chapters from the chapter list

Date: 2026-11-09
Status: Accepted

## Context

Issue #15 adds the reading flow (SPEC.md feature 2), progress over it (feature 4) and the chapter list in the reader (feature 7). ADR 0009 made each spine item one section and left the flow and notes to #15, keeping sections fixed so stored positions (ADR 0008) stay valid.

What the fixtures show, from `tests/epub/fixtures.test.ts` and the issue's research:

- Gutenberg's EPUB 3 files put the header, title page, contents and often the first chapters in one spine item: _Moby Dick_'s second spine item holds all of that and chapters 1 to 7. So the flow can't start or end at a section boundary.
- Paperwork can sit between the author's parts: _Pride and Prejudice_'s list of illustrations comes between its preface and Chapter I, and Standard Ebooks' half-title page between _A Christmas Carol_'s preface and Stave I. So the flow needs gaps, not only a start and an end.
- Many chapters share a spine item (_Moby Dick_: 135 chapters in 11), so a chapter can't stay one section (SPEC.md's former Open question).

## Decision

- **The flow is a list of parts** (`Part` in `src/core/readingFlow.ts`): each starts at a section and paragraph, runs to the next, and is in the flow or skipped. `findParts` (`src/core/epub/flow.ts`) works them out at import, by the rules in SPEC.md feature 2.
- **Stored with the text**, as `parts` on `StoredText` in `src/ui/storage.ts`, worked out once at import like the chapter list (ADR 0009). The parts name paragraphs, not words, so they keep their meaning when the splitting rules change, as positions do (ADR 0008). The field is optional and the database stays at version 1. Texts stored before #15 have none and read whole (docs/known-issues.md).
- **Notes go into one section after the spine's sections**, which is skipped. The spine sections keep their indices, so ADR 0009's "a section is one spine item" still holds for them; a note's paragraphs leave the section they were in. Rejected: skipping notes in place, which leaves a gap per footnote in the flow and no single chapter-list entry for them.
- **Progress counts the flow's words** (`flowProgress`): `Reading.progress` is now the flow's words before the position over the flow's words, and `Reading.left` counts the flow's words only. This replaces ADR 0008's "the word's index over the word count" for books with parts; for pasted text and books stored before #15, the flow is the whole text, so nothing changes.
- **A chapter runs from one chapter-list entry or part start to the next** (`chapterBounds`), as KOReader does, so the deepest entry wins and a chapter is wholly in or out of the flow. The paused view shows the chapter's paragraphs across sections, and chapter time left sums its words.
- **Playing follows the flow** (`nextWord`): `tick` in `src/core/schedule.ts` takes what follows each word, so it jumps over a skipped part on schedule, stops at the end of a skipped part, and finishes after the flow's last word.

## Consequences

- Books imported before #15 read from their first word to their last until deleted and imported again (docs/known-issues.md).
- Importing a book with notes now gives different words than before #15 (no markers), so its `bookId` changes: importing it again adds a second copy rather than finding the first.
- The flow's rules are heuristics checked on six fixture books. A book whose paperwork has no markup and no title the rules know stays in the flow; the known cases are in docs/known-issues.md.
