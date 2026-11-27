# 9. Parse EPUB files in core with our own ZIP and XML readers

Date: 2026-11-07
Status: Accepted

## Context

- EPUB import ([SPEC.md feature 2](../../SPEC.md#2-import-epub-files)) is reading logic, so it runs in `src/core/` and is unit-tested in Node (ADR 0003).
- An EPUB is a ZIP archive of XML and XHTML documents ([EPUB 3.3](https://www.w3.org/TR/epub-33/)).
- Its ZIP entries are only "stored (uncompressed) and Deflate-compressed" ([§ 4.3.2](https://www.w3.org/TR/epub-33/#sec-zip-container-zipreqs)). Node has `DecompressionStream` as a global ([Node.js, Globals](https://nodejs.org/api/globals.html#class-decompressionstream)), and so does every target browser (`src/core/webApis.d.ts`). It inflates natively.
- Browsers read XML with `DOMParser`, which isn't among Node's globals ([Node.js, Globals](https://nodejs.org/api/globals.html)).

Options considered:

- **The archive:** `fflate` or JSZip, or a reader of our own over `DecompressionStream`.
- **The XML:** `DOMParser` in `src/ui/`, or a reader of our own.

## Decision

- Our own ZIP and XML readers parse EPUBs, in `src/core/epub/`, with no new dependency.
- `zip.ts` reads the central directory, and stored and deflated entries, which it inflates with `DecompressionStream`.
  - It reads no ZIP64. A ZIP needs ZIP64 for a file over 4 GiB ([APPNOTE.TXT, 4.3.9.2](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L431-L433)). It also needs it when a field at the end of the central directory is too small, such as its 2-byte count of entries ([4.4.1.4](https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt#L663-L666)).
  - A book's EPUB is far below those limits. On 2026-11-27, the largest EPUB in the repo was a fixture of 699,614 bytes (`tests/fixtures/epub/README.md`, PR #134).
- `xml.ts` builds a tree of elements and text, and checks that tags nest.
  - It replaces XML's five predefined entities ([XML 1.0, § 4.6](https://www.w3.org/TR/xml/#sec-predefined-ent)) and numeric references.
  - It doesn't validate. It skips the DTD, its internal subset included. XML 1.0 asks even a non-validating processor to read that subset ([§ 5.1](https://www.w3.org/TR/xml/#proc-types)), so `xml.ts` isn't a conforming XML processor.
  - It doesn't resolve namespaces.
- `DecompressionStream` and `TextDecoder` meet ADR 0003's rule for web APIs, and `src/core/webApis.d.ts` declares them. `DecompressionStream` is asynchronous, so `parseEpub` returns a promise.
- The other options lose:
  - `fflate` and JSZip would add a dependency, with the costs that [CLAUDE.md, Code](../../CLAUDE.md#code) lists, and `DecompressionStream` covers the hard part.
  - `DOMParser` would move parsing into `src/ui/`, and parsing would lose its unit tests.

## Consequences

- The ZIP and XML readers are ours to maintain.
- Parsing runs on the page's main thread ([known issue](../known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)).
- Some EPUBs fail or lose a little:
  - one written with ZIP64 can fail to import ([known issue](../known-issues.md#an-epub-written-with-zip64-can-fail-to-import));
  - one that binds the EPUB namespace to another prefix loses its verse marks and nav ([known issue](../known-issues.md#unusual-namespace-prefixes-lose-verse-and-the-nav));
  - one with named entities beyond XML's five shows them as written, since `xml.ts` never reads the DTD that defines them ([known issue](../known-issues.md#named-entities-other-than-xmls-five-show-as-written)).
- Revisit `zip.ts` and `xml.ts` if the EPUBs people import need ZIP64, a DTD's entities or namespaces.
