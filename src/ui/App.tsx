import { useCallback, useEffect, useState } from "react";
import { bookId } from "../core/bookId.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import type { BookInfo } from "../core/library.ts";
import {
  findPosition,
  progressTable,
  readingState,
  type ProgressTable,
} from "../core/position.ts";
import { flowStart, readingFlow } from "../core/readingFlow.ts";
import { splitText, type Section } from "../core/text.ts";
import AddText from "./AddText.tsx";
import Library from "./Library.tsx";
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
      sections: Section[];
      timing: Timing;
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

  const reload = useCallback(() => {
    listBooks().then(
      (list) => {
        setBooks(list);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, []);
  useEffect(reload, [reload]);

  /** Opens `book` where its reading stopped (SPEC.md feature 4). */
  const read = async (
    book: BookInfo,
    { sections, parts }: Text,
    timing = timeWords(splitText(sections)),
  ) => {
    await markOpened(book.id, Date.now());
    setNewId(null);
    const saved = book.reading;
    setScreen({
      name: "reader",
      id: book.id,
      sections,
      timing,
      table: progressTable(timing),
      start: saved
        ? findPosition(timing.words, saved.position)
        : flowStart(readingFlow(timing.words, parts)),
      startFinished: saved?.finished ?? false,
    });
  };

  const back = () => {
    setScreen({ name: "library" });
    reload();
  };

  /** Opens a book from the library. */
  const open = (book: BookInfo) => {
    getText(book.id)
      .then((text) => (text ? read(book, text) : back()))
      .catch(() => {
        setFailed(true);
        setScreen({ name: "library" });
      });
  };

  if (screen.name === "reader") {
    const { id, timing, table } = screen;
    return (
      <Reader
        sections={screen.sections}
        timing={timing}
        start={screen.start}
        startFinished={screen.startFinished}
        onSave={(index, finished) =>
          saveReading(id, readingState(timing, table, index, finished))
        }
        onBack={back}
      />
    );
  }
  if (screen.name === "addText") {
    return (
      <AddText
        onBack={() => setScreen({ name: "library" })}
        onSave={async ({
          title,
          author,
          sections,
          chapters,
          parts,
          timing,
          from,
        }) => {
          // A text already in the library is handed back, so Add text can
          // say so (SPEC.md features 1 and 2). A new book opens first where
          // its reading flow starts (#15).
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
          };
          const book = await addBook(added, { sections, chapters, parts });
          if (book !== added) return book;
          if (from === "epub") {
            // A new book goes to the library, marked New (SPEC.md feature 2).
            setNewId(book.id);
            back();
          } else {
            await read(book, { sections, chapters, parts }, timing);
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
