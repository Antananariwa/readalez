# 9. Parse EPUB files in core with our own ZIP and XML readers

Date: 2026-11-07
Status: Accepted

## Context

Issue #14 imports EPUB files (SPEC.md feature 2). An EPUB is a ZIP archive of XML documents: `META-INF/container.xml` names the package document, which lists the metadata, the files and the spine (the reading order), and points to a table of contents (EPUB 3's navigation document, or EPUB 2's NCX). The text is in XHTML documents.

ADR 0003 keeps parsing imported texts in `src/core/`, as plain TypeScript with no browser APIs, unit-tested in Node. Browsers read XML with `DOMParser`, which Node doesn't have, so PR #3 expected this issue to propose a small DOM-free ZIP and XML parser. Until now core used no web API at all: `bookId` has its own SHA-256 and UTF-8 encoder because `crypto.subtle` and `TextEncoder` were out (ADR 0007).

ZIP entries in an EPUB are stored or deflated. Inflating DEFLATE by hand takes a few hundred lines. Browsers and Node both have `DecompressionStream`, which inflates natively.

Positions are stored by section, paragraph and word (ADR 0008), and texts are stored parsed (ADR 0007). #15 adds the reading flow (where reading starts and ends, and what it skips), the Notes section and the chapter list in the reader. Positions saved before #15 must still point into the same text after it.

## Decision

- **Our own ZIP and XML readers, in `src/core/epub/`, with no new dependency.**
  - `zip.ts` reads the central directory and the stored and deflated entries, which is all EPUB uses. There is no ZIP64, since books are far under 4 GB. Checking CRCs and refusing encrypted entries are left to #16 (broken and copy-protected files).
  - `xml.ts` is a non-validating reader that builds a small tree of elements and text and checks that tags nest. It replaces XML's five entities and numeric references, and leaves other named entities as written, since they need a DTD, which it never loads (docs/known-issues.md). It doesn't resolve namespaces: elements match by local name, and attributes by their usual prefixed names (`epub:type`, `opf:role`).
  - Rejected: `fflate` or JSZip for the archive, since each dependency adds download size on phones, updates and license notices (CLAUDE.md), and `DecompressionStream` covers the hard part. `DOMParser` is rejected because Node lacks it, so parsing would move into `src/ui/` and lose its unit tests.
- **Where core's line sits.** This amends ADR 0003's "no browser APIs". Core may use a global only if two things hold:
  - It is in WinterTC's [Minimum Common Web API](https://github.com/WinterTC55/proposal-minimum-common-api/blob/008b840d4eb624c5ab466b069a79cbea67d57c90/index.bs), a list of web APIs for runtimes outside browsers, such as Node. That list includes `DecompressionStream`, `TextDecoder`, `ReadableStream` and `Response`.
  - Every target browser has it (SPEC.md, Devices and browsers).

  Each such global is declared by hand in `src/core/webApis.d.ts`, with only the parts core uses and a link showing browser support. `tsconfig.core.json` still has no DOM library (ADR 0005), so a global not declared there, the DOM included, still fails the typecheck. This PR declares two:
  - `DecompressionStream("deflate-raw")`: in Safari 16.4, Chrome 103 and Firefox 113 ([MDN's compatibility data](https://github.com/mdn/browser-compat-data/blob/82daeebf5a7073d55223a8cdb8aa54fb9416e27d/api/DecompressionStream.json)). It ran in the dev container's Node v24.22.2.
  - `TextDecoder`: decodes the XML documents, which are UTF-8 or UTF-16 in an EPUB.

  `DecompressionStream` is asynchronous, so `parseEpub` returns a promise.

- **A section is one spine item**, in spine order, items marked `linear="no"` included. A spine item that isn't XHTML, or whose file is missing, is an empty section, so the sections after it keep their indices. The spine is fixed by the file, so the parts #15 changes don't move a stored position:
  - #15 can mark where the reading flow starts and ends, and what it skips, as positions over these same sections.
  - Changes to how the chapter list is worked out don't touch the sections either.
  - Two devices that import the same file get the same sections, which backups (#21) rely on.
- **The chapter list is kept apart from the sections**: `Chapter` in `src/core/epub.ts` is a title, a depth, and the section and paragraph it starts at.
  - It comes from EPUB 3's `toc` nav, or else from EPUB 2's NCX.
  - A link's `#fragment` finds the paragraph at or after the element with that id.
  - With no usable table of contents, each `h1` to `h6` heading is a chapter.
  - It is stored with the text (`chapters` in `src/ui/storage.ts`'s `StoredText`), so #15 can show it for books imported before it. The field is optional, and the database stays at version 1, as in ADR 0008.
- **Fixtures:** the fixture EPUBs live in `tests/fixtures/epub/`, with their sources in its README. The tests that read them are in `tests/epub/`, which `tsconfig.node.json` covers with Node's types. Tests in `src/core/` run with `types: []` and can't read files. The rules for XHTML and metadata are tested in `src/core/epub/*.test.ts` and `src/core/epub.test.ts`, on small EPUBs built in memory by `src/core/epub/testZip.ts`.

## Consequences

- `src/core/epub/` and `src/core/epub.ts` hold about 1,000 lines of our own code, comments included, to maintain.
- Parsing runs on the main thread. In Node on the dev container, the Standard Ebooks fixture (_A Christmas Carol_, 28,626 words by its metadata) parsed in 35 ms. Long books are #16, and performance targets are #73.
- An EPUB with an unusual prefix for the `epub:` or `opf:` namespaces, or with named entities beyond XML's five, loses verse marks, author roles or those characters (docs/known-issues.md).
- `crypto.subtle` and `TextEncoder` are in the Minimum Common Web API too, so `bookId`'s hand-written SHA-256 (ADR 0007) could now use the platform's. That code is unchanged here, and it would also become asynchronous.
