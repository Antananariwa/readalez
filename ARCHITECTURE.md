# Architecture

The code's stable shape, in the form of [matklad's ARCHITECTURE.md](https://matklad.github.io/2021/02/06/ARCHITECTURE.md.html): a bird's eye view, a code map that names the important files and types, the invariants and the cross-cutting concerns. It leaves out how each part works. Significant technical decisions: [docs/adr](docs/adr/).

## Bird's eye view

What the app does: [SPEC.md](SPEC.md). In the code, `src/core/` reads pasted text and EPUB files into a book's text, and turns that text into words with their durations, as plain TypeScript (ADR 0003). `src/ui/` plays the words with React and keeps the library in the browser's storage, in a PWA (ADR 0002).

## Code map

Search by name finds each file and type named here.

### `src/core/`

The reading logic.

- **Adding books:** `paste.ts` reads pasted text (`parsePaste`). `epub.ts` reads an EPUB file into sections and a chapter list (`parseEpub`, `Chapter`, ADR 0009, ADR 0013), with its parsers in `epub/`.
- **Words:** `text.ts` splits a book's sections (`Section`) into the words the reader shows (`Word`, `splitText`).
- **Timing:** `durations.ts` gives each word its duration (`Timing`), from the values in `timingValues.ts`. `schedule.ts` says which word shows at a given moment. `timeLeft.ts` works out time left.
- **Reading flow:** `readingFlow.ts` holds the reading flow over the words (`Flow`), its parts (`Part`, ADR 0013) and where chapters start. `chapterText.ts` gives the paused view a chapter's paragraphs.
- **Library and positions:** `library.ts` holds what the library knows about a book (`BookInfo`). `bookId.ts` names a book by the SHA-256 of its words (ADR 0012). `position.ts` holds a position (`Position`) and the progress and time left saved with it (ADR 0008). `builtInBooks.ts` is the built-in books' catalog.

### `src/ui/`

React components, and the code that uses the page, the browser's storage and the service worker. `main.tsx` starts the app.

- **Screens:** `App.tsx` switches between the screens, one component each, such as `Library.tsx` and `Reader.tsx`, in React state with no router. It also joins core to storage: it stores new books, opens them, and fetches a built-in book's EPUB on its first open.
- **Reader:** `Reader.tsx` holds the reader and its controls. `WordFrame.tsx` draws the word frame, and `PausedText.tsx` the paused view. `usePlayback.ts` holds the playback state and controls (`PlaybackControls`) and runs the `requestAnimationFrame` loop that drives `schedule.ts`.
- **Storage and import:** `storage.ts` keeps the library in IndexedDB (ADR 0007), positions included (ADR 0008). `importEpub.ts` reads an EPUB file with import progress (`readEpub`), for an import and for a built-in book's first open (ADR 0011).
- **Offline:** `registerServiceWorker.ts` registers the service worker that `vite-plugin-pwa` builds from `vite.config.ts`. The same config writes the web app manifest and precaches the built-in books (ADR 0014, ADR 0011).
- `styles.css` holds the layout, including where the focus point sits, and the light and dark themes.

### Other folders

- `public/`: files served as they are.
- `scripts/`: Node scripts: the generators under [Code generation](#code-generation), and `append-review.ts`, which adds a merged PR's review to `docs/reviews.md`, run by `.github/workflows/reviews.yml`.

## Invariants

- `src/core/` imports nothing from `src/ui/`, React or Node's modules. It uses no browser or Node globals apart from those declared in `src/core/webApis.d.ts` (ADR 0003, ADR 0009).
  Enforced by `npm run check`, through `tsconfig.core.json` and `.oxlintrc.json` (ADR 0005).
- `src/ui/` holds no reading logic (ADR 0003).
- A book is stored as its `BookInfo` and its parsed text (`Section`, `Chapter`, `Part`), and never parsed again. So a change to the paste or EPUB parsers reaches only books added after it. Its words are split again at every open, and a stored position is found again in the new split (ADR 0013, ADR 0008).
- The app sends no requests to other sites (SPEC.md feature 13, ADR 0006). `e2e/pwa.spec.ts` checks it for loading the app.

## Cross-cutting concerns

### Testing

Core's unit tests sit beside the code they test (`*.test.ts`), with their texts in `src/core/fixtures/`. `src/core/epub/testZip.ts` builds their ZIP files; `scripts/build-books.ts` and `e2e/importEpub.spec.ts` use it too, and the app doesn't. Unit tests that read files are in `tests/`, since tests in `src/core/` can't (ADR 0009). They check the built-in books against their catalog, the test books in `tests/fixtures/epub/`, and repo-wide rules in `tests/tooling/`, such as the Playwright version pin.

`e2e/` holds Playwright tests against the production build, one spec file per area, with shared helpers in `helpers.ts` (ADR 0005).

### Code generation

Some committed files are generated. Rerun their generator instead of editing them:

- The built-in books' EPUB files in `public/books/` and their catalog, `src/core/builtInBooks.ts`: `scripts/build-books.ts` (`npm run books`, ADR 0011). `tests/builtInBooks.test.ts` fails when the catalog is out of date.
- The app icons in `public/`: `scripts/render-icons.ts` renders them from `public/icon.svg` (`npm run icons`).
