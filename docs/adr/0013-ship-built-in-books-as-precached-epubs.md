# 13. Ship the built-in books as precached EPUBs, imported on first open, with a generated catalog

Date: 2026-11-12
Status: Accepted

## Context

The built-in books ([SPEC.md feature 3](../../SPEC.md#3-built-in-books)), 24 on 2026-11-12, bring these forces:

- **Size.** On 2026-11-12, the 24 EPUBs, built without their pictures, totalled 4,244,389 bytes, from 76,181 for _Jekyll and Hyde_ to 377,230 for _Dracula_ (PR #98). The built app without them was 333 KB on 2026-11-26 (`du -sb --exclude=books dist`). Every book has to work offline after the first visit ([SPEC.md feature 12, Offline](../../SPEC.md#offline)).
- **Import time.** On 2026-11-26, in Node v24.22.2 on the dev container, parsing all 24 took about 0.5 s, and parsing them and splitting them into words about 12.5 s (two runs of a script not in the repo). Import runs on the page's main thread ([known issue](../known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)). So importing all of them on the first visit would keep the page busy for a long time.
- **One code path.** They go through the same import as the reader's own EPUBs, so they test it too ([SPEC.md feature 3, First open](../../SPEC.md#first-open)).
- **A source anyone can check.** Each is built from a pinned commit of its Standard Ebooks repository, so anyone can see where it came from and rebuild it.

Options considered:

- **Ship the books already parsed, as JSON.**
- **Download each book when it's first opened**, which keeps the first visit small.
- **Build the files during `npm run build`.**
- **Build the files with a script, commit them, precache them, and import each on its first open.**

## Decision

- **Built by `scripts/build-books.ts`** (`npm run books`) from each book's pinned commit, without its images, into `public/books/<repository>.epub`.
  - The files are committed, so the app's build downloads nothing.
  - Two runs on 2026-11-12 gave files with the same SHA-256 (PR #98).
- **A generated catalog,** `src/core/builtInBooks.ts`, written by the same script.
  - `describeBook` in `scripts/builtInBook.ts` works each entry out with the same core code the app imports with.
  - The library lists the built-in books from it without reading their files (SPEC.md feature 3).
  - It's a TypeScript module rather than JSON, so the typecheck checks it against `BuiltInBook`.
- **Imported on first open,** with `readEpub` (`src/ui/importEpub.ts`), as an imported EPUB is.
- **Precached by the service worker:** `books/*.epub` joins Workbox's default `globPatterns` in `vite.config.ts`. A fetch for a book is then answered from the cache, online or not.
- **The other options lose:**
  - Parsed JSON would skip the import code that SPEC.md feature 3 has them test.
  - Downloading on first open would leave unopened books unreadable offline.
  - Building during `npm run build` would make every build, Cloudflare's included, depend on GitHub.

## Consequences

- The first visit downloads the books too, in the service worker's install: about 4.2 MB on 2026-11-12. How long that takes on a phone is unknown, and #73 holds the size targets.
- The repository holds the books' files, and grows by a book's size whenever that book is rebuilt.
- A book's first open takes as long as importing it. How long that is on the owner's iPhone is unknown.
- The catalog goes stale when the core code that `describeBook` runs changes:
  - a book's ID changes with the EPUB parser's output (`src/core/bookId.ts`);
  - its `reading` changes with the splitting, timing or reading-flow rules.

  `tests/builtInBooks.test.ts` reruns `describeBook` on the shortest book, and fails until `npm run books` rebuilds the catalog. The other books aren't rechecked, to keep the unit tests quick.

- A stored book keeps the text it was imported with (ADR 0007). So a rebuilt book file reaches a reader only if they haven't opened that book yet.
