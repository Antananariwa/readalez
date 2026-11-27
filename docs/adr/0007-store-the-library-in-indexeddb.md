# 7. Store the library in IndexedDB

Date: 2026-11-06
Status: Accepted

## Context

- Books, progress, settings and reading sessions stay in the browser's storage, with no server ([SPEC.md, Everything stays on the device](../../SPEC.md#everything-stays-on-the-device)).
- The stored data will change shape as features arrive, so it needs a schema version from the start.
- A pasted novel is about 1 MB of text, and the library lists every book without loading their texts.

Options considered:

- **localStorage.** It holds "string-only key/value pairs", "5 MiB of local storage" per origin ([MDN, Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage)). It is "synchronous in nature", "blocking the execution of other JavaScript code" ([MDN, Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API#concepts_and_usage)).
- **IndexedDB.** It stores "any objects supported by the structured clone algorithm", in transactions. It works asynchronously, "so as not to block applications" ([MDN, IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API#key_concepts_and_usage)). Each browser sets its own quota ([MDN, Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#other_web_technologies)).
- **IndexedDB through `idb`** (ISC, allowed by [SPEC.md feature 13](../../SPEC.md#licenses)): promises over the same API.

## Decision

- **Storage:** the library lives in IndexedDB, with no wrapper library. `src/ui/storage.ts` wraps the few calls the app needs in promises.
- **Schema version:** the database's version is the schema version. Each change to the stores raises the version of the `readalez` database and adds a step to `upgrade` in `src/ui/storage.ts`.
- **Two stores** hold the library, so it lists books without reading their texts. The book's ID (ADR 0018) keys both:
  - `books`: each book's `BookInfo` (`src/core/library.ts`);
  - `texts`: its parsed text (ADR 0019).

  Adding a book writes both in one transaction, and deleting removes both in one, so a failure leaves nothing half-saved.

- The other options lose:
  - `idb` would add a dependency, with the costs that [CLAUDE.md, Code](../../CLAUDE.md#code) lists, for little code saved.
  - localStorage would hold each book as one string, read and written in one blocking call, under a quota a few novels could fill.

## Consequences

- On 2026-11-06, saving a 1,000,013-character generated text took about 1.4 s from Save to the reader in Chromium and 1.1 s in WebKit, in Playwright on the dev container. `splitText` alone took 1.3 s of a Node run on the same text (PR #72). So word splitting, not storage, sets the time of a save. iPhone times are unknown, and #73 holds the performance targets.
- Node has no IndexedDB, so the unit tests don't cover `src/ui/storage.ts`. The browser tests in `e2e/` do.
