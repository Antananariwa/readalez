# 19. Store each book parsed, in one section per spine item, with its chapter list and reading flow

Date: 2026-11-06
Status: Accepted

## Context

- The app stores positions by section, paragraph and word (ADR 0008), and the backup file's merge compares them across devices ([SPEC.md feature 9, Import](../../SPEC.md#import)).
- The parsers' rules will change. The rules that work out the reading flow and the chapter list still miss cases ([known issues](../known-issues.md#reading-flow-and-notes)).
- One file can hold Gutenberg's header, title page, contents and the first chapters. _Moby Dick_'s second spine item holds all of that and chapters 1 to 7 (`tests/epub/fixtures.test.ts`). Paperwork can also sit between the author's parts: _Pride and Prejudice_'s reading flow skips its list of illustrations, between its preface and Chapter I (same file). So the reading flow can't start, end or skip at file boundaries alone.
- Many chapters share a spine item: _Moby Dick_ has 135 chapters in 11 (`tests/fixtures/epub/README.md`).
- `findParts` (`src/core/epub/flow.ts`) works the reading flow out from what the markup says about each paragraph, from its element ids and from the EPUB's guide (`Content` in `src/core/epub/content.ts`).

Options considered:

- **What to store:** the input, parsed again at each open, or the parsed text.
- **Sections:** one per spine item, or one per chapter.
- **The chapter list and the reading flow:** worked out at each open, or at import and stored with the text.
- **Notes:** skipped where each one stands, or gathered into one section after the spine's.

## Decision

- **The library stores the parsed text, never the input.** A book's paragraphs stay as they were when the app stored it, whatever later versions change in the parsers. So a stored position keeps pointing into the same paragraph. The app splits words again at each open, so changes to word splitting reach books already stored (ADR 0008).
- **Sections:** each spine item becomes one section, in spine order, items marked `linear="no"` included.
  - A spine item that isn't XHTML, or whose file is missing, is an empty section, so the sections after it keep their indices.
  - A book with notes gets one more section for them, after the spine's ([SPEC.md feature 2, Notes](../../SPEC.md#notes)), so the spine's sections keep their indices.
  - Two devices that import the same file get the same sections.
- **The chapter list and the reading flow:** import works both out once, and stores them with the text (`chapters` and `parts` on `StoredText` in `src/ui/storage.ts`). Both name a section and a paragraph, not a word, so they keep their meaning when the splitting rules change, as positions do.
- The other options lose:
  - Parsing again at each open would move a position whenever the paragraph rules change.
  - A section per chapter would move sections, and the positions in them, whenever the chapter-list rules change.
  - Working the flow out at each open would need what `findParts` reads, and the stored text doesn't hold it.
  - Skipping each note where it stands would leave a gap in the reading flow at each note.

## Consequences

- A fix to the parsers, the reading flow or the chapter list reaches only books imported after it. A stored book keeps the text, chapter list and parts from its import.
- Revisit if a fix to the reading flow or the chapter list has to reach books already stored.
