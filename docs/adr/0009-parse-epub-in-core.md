# 9. Parse EPUB files in core with our own ZIP and XML readers

Date: 2026-11-07
Status: Accepted

## Context

- EPUB import ([SPEC.md feature 2](../../SPEC.md#2-import-epub-files)) is reading logic, so it runs in `src/core/` and is unit-tested in Node (ADR 0003).
- An EPUB is a ZIP archive of XML and XHTML documents ([EPUB 3.3](https://www.w3.org/TR/epub-33/)).
- Its ZIP entries are only "stored (uncompressed) and Deflate-compressed" ([§ 4.3.2](https://www.w3.org/TR/epub-33/#sec-zip-container-zipreqs)). Node has `DecompressionStream` as a global ([Node.js, Globals](https://nodejs.org/api/globals.html#class-decompressionstream)), and so does every target browser (`src/core/webApis.d.ts`). It inflates natively.
- Browsers read XML with `DOMParser`, which isn't among Node's globals ([Node.js, Globals](https://nodejs.org/api/globals.html)).
- Positions are stored by section, paragraph and word (ADR 0008), and the text is stored parsed (ADR 0007). The rules that work out the reading flow and the chapter list still miss cases ([known issues](../known-issues.md#reading-flow-and-notes)), so they will change, and a stored position must not depend on them.
- One file can hold Gutenberg's header, title page, contents and the first chapters. _Moby Dick_'s second spine item holds all of that and chapters 1 to 7 (`tests/epub/fixtures.test.ts`). Paperwork can also sit inside the reading flow: _Pride and Prejudice_'s list of illustrations is skipped after its preface (same file). So the reading flow can't start, end or skip at file boundaries alone.

Options considered:

- **The archive:** `fflate` or JSZip, or a reader of our own over `DecompressionStream`.
- **The XML:** `DOMParser` in `src/ui/`, or a reader of our own.

## Decision

- **Our own ZIP and XML readers, in `src/core/epub/`, with no new dependency.**
  - `zip.ts` reads the central directory, and stored and deflated entries, which it inflates with `DecompressionStream`. It reads no ZIP64, which EPUB creators "SHOULD use … only when the content requires them" ([§ 4.3.2](https://www.w3.org/TR/epub-33/#sec-zip-container-zipreqs)).
  - `xml.ts` builds a tree of elements and text, and checks that tags nest. It replaces XML's five predefined entities ([XML 1.0, § 4.6](https://www.w3.org/TR/xml/#sec-predefined-ent)) and numeric references. It doesn't validate, and it reads no DTD, which a non-validating processor needn't read ([XML 1.0, § 5.1](https://www.w3.org/TR/xml/#proc-types)). So other named entities stay as written. It doesn't resolve namespaces.
  - `fflate` and JSZip lose: each dependency adds download size on phones, updates and license notices ([CLAUDE.md, Code](../../CLAUDE.md#code)), and `DecompressionStream` covers the hard part.
  - `DOMParser` loses: parsing would move into `src/ui/` and lose its unit tests.
  - `DecompressionStream` and `TextDecoder` meet ADR 0003's rule for web APIs, and `src/core/webApis.d.ts` declares them. `DecompressionStream` is asynchronous, so `parseEpub` returns a promise.
- **Sections: one per spine item, in spine order, then one for the notes.**
  - Items marked `linear="no"` are included.
  - A spine item that isn't XHTML, or whose file is missing, is an empty section, so the sections after it keep their indices.
  - The notes go into one section after the spine's sections ([SPEC.md feature 2, Notes](../../SPEC.md#notes)), so the spine's sections keep their indices. Skipping each note where it stands loses: it would leave a gap in the reading flow for each note, and no single chapter-list entry for them.

  So a stored position doesn't move when the rules for the reading flow or the chapter list change. Two devices that import the same file get the same sections, which the backup file's merge relies on (ADR 0007).

- **The chapter list and the reading flow sit apart from the sections.** Both are worked out once, at import, and stored with the text (`chapters` and `parts` on `StoredText` in `src/ui/storage.ts`).
  - A chapter-list entry (`Chapter` in `src/core/epub.ts`) is a title, a depth, and the section and paragraph it starts at.
  - A part (`Part` in `src/core/readingFlow.ts`) starts at a section and paragraph, runs to the next part, and is in the reading flow or skipped. `findParts` in `src/core/epub/flow.ts` works the parts out.

  Both name paragraphs, not words, so they keep their meaning when the splitting rules change, as positions do (ADR 0008).

## Consequences

- The ZIP and XML readers are ours to maintain.
- Parsing runs on the page's main thread ([known issue](../known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)).
- Some EPUBs lose a little:
  - one that binds the EPUB namespace to another prefix loses its verse marks and nav ([known issue](../known-issues.md#unusual-namespace-prefixes-lose-verse-and-the-nav));
  - one with named entities beyond XML's five shows them as written ([known issue](../known-issues.md#named-entities-other-than-xmls-five-show-as-written)).
