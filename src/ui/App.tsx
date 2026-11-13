import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { bookId } from "../core/bookId.ts";
import { BUILT_IN_BOOKS } from "../core/builtInBooks.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { libraryBooks, type BookInfo } from "../core/library.ts";
import {
  findPosition,
  progressTable,
  readingState,
  type ProgressTable,
} from "../core/position.ts";
import { flowStart, readingFlow, type Flow } from "../core/readingFlow.ts";
import { splitText, type SplitProgress } from "../core/text.ts";
import AddText, { type NewText } from "./AddText.tsx";
import { readEpub } from "./importEpub.ts";
import { useOfflineBooks } from "./useOfflineBooks.ts";
import Library, { type LibraryFilter } from "./Library.tsx";
import Reader from "./Reader.tsx";
import {
  addBook,
  deleteBook,
  getText,
  listBooks,
  markOpened,
  renameBook,
  saveReading,
  type Text,
} from "./storage.ts";

type Screen =
  | { name: "library" }
  | { name: "addText" }
  | {
      name: "reader";
      id: string;
      text: Text;
      timing: Timing;
      flow: Flow;
      table: ProgressTable;
      start: number;
      startFinished: boolean;
    };

/**
 * Three screens in React state, with no router: the library (home), Add text
 * and the reader. A reload lands in the library.
 */
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "library" });
  const [books, setBooks] = useState<BookInfo[] | null>(null);
  const [failed, setFailed] = useState(false);
  /**
   * The book just imported, marked New in the library until you leave it or
   * reload (SPEC.md feature 2). Only React state, so a reload clears it.
   */
  const [newId, setNewId] = useState<string | null>(null);
  /** A built-in book being imported on its first open (SPEC.md feature 3). */
  const [opening, setOpening] = useState<{
    id: string;
    progress: SplitProgress;
  } | null>(null);
  /** Set when a built-in book couldn't be opened. */
  const [openFailed, setOpenFailed] = useState(false);
  /**
   * The library's filter chip that's on (SPEC.md feature 4). Kept here so
   * it stays on after reading a book; a reload goes back to All.
   */
  const [source, setSource] = useState<LibraryFilter>("all");
  /** Kept here, so it goes on counting while a book is open. */
  const offline = useOfflineBooks();

  const reload = useCallback(() => {
    listBooks().then(
      (list) => {
        // Built-in books show before they're stored (ADR 0013).
        setBooks(libraryBooks(list, BUILT_IN_BOOKS));
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, []);
  useEffect(reload, [reload]);

  /** Opens `book` where its reading stopped (SPEC.md feature 4). */
  const read = async (
    book: BookInfo,
    text: Text,
    timing = timeWords(splitText(text.sections)),
  ) => {
    await markOpened(book.id, Date.now());
    setNewId(null);
    const saved = book.reading;
    const flow = readingFlow(timing.words, text.parts);
    setScreen({
      name: "reader",
      id: book.id,
      text,
      timing,
      flow,
      table: progressTable(timing),
      start: saved
        ? findPosition(timing.words, saved.position)
        : flowStart(flow),
      startFinished: saved?.finished ?? false,
    });
  };

  const back = () => {
    setScreen({ name: "library" });
    reload();
  };

  /**
   * Stores a new book, unless its text is in the library already: that copy
   * is returned instead, with `isNew` false (SPEC.md features 1 and 2).
   */
  const store = async (
    { title, author, sections, chapters, parts, timing }: Omit<NewText, "from">,
    builtIn?: string,
  ): Promise<{ book: BookInfo; isNew: boolean }> => {
    const flow = readingFlow(timing.words, parts);
    const added: BookInfo = {
      id: bookId(sections),
      title,
      author,
      addedAt: Date.now(),
      // So the library shows 0% and the whole time left at once.
      reading: readingState(
        timing,
        progressTable(timing),
        flowStart(flow),
        false,
        flow,
      ),
      ...(builtIn === undefined ? {} : { builtIn }),
    };
    const book = await addBook(added, { sections, chapters, parts });
    return { book, isNew: book === added };
  };

  /**
   * Opens a built-in book the first time: its EPUB, which the service worker
   * keeps for offline use, goes through the same import as Import EPUB, and
   * the book opens where its reading flow starts (SPEC.md feature 3).
   */
  const openBuiltIn = async (book: BookInfo, slug: string) => {
    setOpenFailed(false);
    setOpening({ id: book.id, progress: { done: 0, total: 1 } });
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}books/${slug}.epub`,
      );
      if (!response.ok) throw new Error(`${response.status}`);
      const epub = await readEpub(
        new Uint8Array(await response.arrayBuffer()),
        `${slug}.epub`,
        (progress) => flushSync(() => setOpening({ id: book.id, progress })),
      );
      const { book: stored } = await store(epub, slug);
      setOpening(null);
      await read(stored, epub, epub.timing);
    } catch {
      setOpening(null);
      setOpenFailed(true);
    }
  };

  /** Opens a book from the library. */
  const open = (book: BookInfo) => {
    setOpenFailed(false);
    getText(book.id)
      .then((text) => {
        if (text) return read(book, text);
        if (book.builtIn !== undefined) return openBuiltIn(book, book.builtIn);
        back();
      })
      .catch(() => {
        setFailed(true);
        setScreen({ name: "library" });
      });
  };

  if (screen.name === "reader") {
    const { id, timing, table, flow } = screen;
    return (
      <Reader
        sections={screen.text.sections}
        chapters={screen.text.chapters}
        parts={screen.text.parts}
        flow={flow}
        timing={timing}
        start={screen.start}
        startFinished={screen.startFinished}
        onSave={(index, finished) =>
          saveReading(id, readingState(timing, table, index, finished, flow))
        }
        onBack={back}
      />
    );
  }
  if (screen.name === "addText") {
    return (
      <AddText
        onBack={() => setScreen({ name: "library" })}
        onSave={async (text) => {
          // A text already in the library is handed back, so Add text can
          // say so (SPEC.md features 1 and 2). A new book opens first where
          // its reading flow starts (#15).
          const { book, isNew } = await store(text);
          if (!isNew) return book;
          if (text.from === "epub") {
            // A new book goes to the library, marked New (SPEC.md feature 2).
            setNewId(book.id);
            back();
          } else {
            await read(book, text, text.timing);
          }
          return null;
        }}
        onOpen={open}
      />
    );
  }
  return (
    <Library
      books={books}
      failed={failed}
      newId={newId}
      opening={opening}
      openFailed={openFailed}
      source={source}
      onSource={setSource}
      offline={offline}
      onAdd={() => {
        setNewId(null);
        setScreen({ name: "addText" });
      }}
      onOpen={open}
      onRename={(book, title) => {
        renameBook(book.id, title).then(reload, reload);
      }}
      onDelete={(book) => {
        deleteBook(book.id).then(reload, reload);
      }}
    />
  );
}
