# 7. Store the library in IndexedDB, with books known by a hash of their text

Date: 2026-11-06
Status: Accepted; its "Same text twice" rule is superseded by SPEC.md features 1 and 2 (#14)

## Context

Issue #12 makes texts survive a reload. Everything stays in the browser's storage, with no server (SPEC.md, Principles). Later issues add positions (#13), settings (#18), reading sessions (#20) and backups that merge across devices (#21), so the stored data needs a schema version from the start, and books need an identity that is the same on every device. A pasted novel is about 1 MB of text, and the library should list every book without loading their texts.

## Decision

- **Storage: IndexedDB, without a wrapper library.** It stores the parsed sections as objects and works asynchronously; localStorage would mean turning each book into one string, read and written in one blocking call, within a per-site quota a few novels might fill (none of this checked against browser documentation, since the firewall blocks web pages, #71). `src/ui/storage.ts` wraps the few calls the app needs in promises, in about 150 lines, instead of adding `idb` (ISC, which the allowlist permits): no new dependency to download, update and credit.
- **Schema version: the database's version.** The database is `readalez`, version 1. `upgrade` in `src/ui/storage.ts` adds one step per version, so a later issue that adds a store raises the version and adds a step. Backups get their own format version in #21, since a backup outlives the schema it came from.
- **Two stores**, so the library lists books without reading their texts:
  - `books`, keyed by `id`: `BookInfo` from `src/core/library.ts` (title, author, when it was added and last opened).
  - `texts`, keyed by `id`: the book's sections.

  Adding a book writes both in one transaction, and deleting removes both in one, so nothing half-saved is left.

- **Parsed sections are stored, not the pasted text.** A book's paragraphs then stay as they were when it was added, whatever later versions change in the paste parser, so positions stored by section, paragraph and word (SPEC.md feature 4, #13) keep pointing into the same paragraph. Words are split again on each open, so changes to word splitting reach books already stored.
- **Book ID: the SHA-256 of the book's words**, as 64 hex digits (`bookId` in `src/core/bookId.ts`). The input is every paragraph's text, verse lines joined by line breaks, with a blank line between paragraphs, in UTF-8. Titles and paragraph kinds stay out, so a rename or a change in how a heading is recognised doesn't make a different book. The ID is computed once, when the book is added, and stored with it.
  - SHA-256, a standard hash with 256 bits, so two different texts getting the same ID is not a practical concern.
  - Written in `src/core/` in plain TypeScript, because core can't use the browser's `crypto.subtle` or `TextEncoder` (ADR 0003, ADR 0005), and so it's synchronous and unit-tested in Node. The tests compare it with Node's `crypto.createHash("sha256")`.
- **Same text twice:** adding a book whose ID is already stored opens the stored copy, with its own title (the owner's choice for pasted texts, matching SPEC.md feature 2 for EPUBs).

## Consequences

- The 1 MB save is dominated by word splitting, not storage: in Playwright on the dev container, saving a 1,000,013-character generated text took about 1.4 s from Save to the reader in Chromium and 1.1 s in WebKit, both on `main` before this change and with it (issue #12's PR). `splitText` alone took 1.3 s of a Node run on the same text. iPhone times are unknown; performance targets are in #73.
- The unit tests run in Node, which has no IndexedDB, so `src/ui/storage.ts` is covered by the browser tests in `e2e/library.spec.ts` only.
- A book imported on two devices gets the same ID only if both parse it into the same words. A parser change between the two imports gives two books; the backup merge (#21) inherits that.
