# 13. Ship the built-in books as precached EPUBs, imported on first open, with a generated catalog

Date: 2026-11-12
Status: Accepted

## Context

Issue #17 ships the built-in books (SPEC.md feature 3). The owner widened it from three books to 24 (#17), which changes the costs:

- **Size.** The 24 EPUBs built by `npm run books`, without pictures, total 4,244,389 bytes, from 76,181 for _Jekyll and Hyde_ to 377,230 for _Dracula_. Before them, the built app in `dist/` was 332 KB (`du -sh dist`, while planning #17). The owner chose to download them all with the app, so every one works offline after the first visit, over downloading each when first opened (#17).
- **Import time.** Parsing all 24 in Node in the dev container took 501 ms. Parsing and splitting them into words took 12,909 ms (scripts run while planning #17, not in the repo). Import runs on the page's main thread ([known issue](../known-issues.md#a-long-book-keeps-the-page-busy-while-its-imported-and-opened)), so importing all of them on the first visit would keep the page busy for a long time, longer on a phone (not checked).
- **One code path.** SPEC.md feature 3 has them go through the same import as the reader's own EPUBs, so they test it too.
- **Where they come from.** The issue asks for a script that builds them from pinned commits of Standard Ebooks' repositories, so anyone can see their source and rebuild them.

## Decision

- **Built by `scripts/build-books.ts`** (`npm run books`).
  - It downloads each book's pinned commit from GitHub, zips its `src/` folder without `epub/images/`, and writes `public/books/<repository>.epub`. The zip has `mimetype` stored first, the rest deflated, sorted names and fixed dates, with the header code shared with the tests' EPUBs (`zipArchive` in `src/core/epub/testZip.ts`).
  - Two runs on 2026-11-12 gave files with the same SHA-256.
  - The list of books, with each author's and translator's death year, lives in the script. It refuses a death year from 1956 on (SPEC.md, Legal and licensing).
  - The files are committed, as the fixtures are: the build doesn't download anything.
- **A generated catalog**, `src/core/builtInBooks.ts`, written by the same script.
  - For each book it holds the repository name as its slug, the `bookId` of its text, title, author, Standard Ebooks' summary and genres, and the `Reading` where its flow starts. `describeBook` in `scripts/builtInBook.ts` works these out with the same core code the app imports with.
  - The library lists the built-in books from it (`libraryBooks` in `src/core/library.ts`) without reading their files, at 0% with their time left.
  - It's a TypeScript module rather than JSON, so the typecheck checks it against `BuiltInBook`.
- **Imported on first open.** Tapping a built-in book that isn't stored fetches its EPUB and imports it with `readEpub` (`src/ui/importEpub.ts`, shared with Import EPUB), with a progress bar on its row. It's stored with `builtIn` set to its slug, then opens where its flow starts.
  - The library matches a stored built-in book to its catalog entry by slug, since the ID changes when the splitting rules do (ADR 0007).
  - It also matches by ID, so a copy of the same text imported by hand counts as the book.
- **Precached by the service worker**: `books/*.epub` joins Workbox's default `globPatterns` in `vite.config.ts`. Each file is under Workbox's 2 MiB limit per file. A fetch for a book is then answered from the cache, online or not.
- **Rejected:**
  - Shipping the books already parsed, as JSON. It would skip the import code SPEC.md feature 3 asks them to test, and parsed text stored as JSON would likely be larger than zipped XHTML (not measured).
  - Building the files during `npm run build`. Every build, Cloudflare's included, would depend on GitHub, and CI workflow files are the owner's to change (CLAUDE.md).

## Consequences

- The first visit downloads about 4.2 MB more: the app shell first, then the books in the service worker's install. How long that takes on a phone is not checked; #73 holds the size targets.
- The repository grows by 4.2 MB, and by each rebuilt book's size whenever a book changes.
- A book's first open takes as long as importing it. On the owner's iPhone that is unknown; in Chromium with the CPU slowed 8 times, _Dracula_'s bar was seen moving.
- The catalog's `reading` (its time left) and `id` go stale when the splitting or timing rules change. `tests/builtInBooks.test.ts` reruns `describeBook` on the shortest book and fails until `npm run books` rebuilds the catalog. The other 23 are not rechecked, to keep the unit tests quick.
- Books already stored keep the text they were imported with, as any imported book does (ADR 0007). A rebuilt book file reaches readers only for books they haven't opened yet.
