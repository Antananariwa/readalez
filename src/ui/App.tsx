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
    sections: Section[],
    timing = timeWords(splitText(sections)),
  ) => {
    await markOpened(book.id, Date.now());
    const saved = book.reading;
    setScreen({
      name: "reader",
      id: book.id,
      sections,
      timing,
      table: progressTable(timing),
      start: saved ? findPosition(timing.words, saved.position) : 0,
      startFinished: saved?.finished ?? false,
    });
  };

  const back = () => {
    setScreen({ name: "library" });
    reload();
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
        onSave={async ({ title, author, sections, chapters, timing }) => {
          // A text already in the library opens the copy there (SPEC.md
          // features 1 and 2).
          const added: BookInfo = {
            id: bookId(sections),
            title,
            author,
            addedAt: Date.now(),
            // So the library shows 0% and the whole time left at once.
            reading: readingState(timing, progressTable(timing), 0, false),
          };
          const book = await addBook(added, sections, chapters);
          if (book === added) {
            await read(book, sections, timing);
          } else {
            await read(book, (await getText(book.id)) ?? sections);
          }
        }}
      />
    );
  }
  return (
    <Library
      books={books}
      failed={failed}
      onAdd={() => setScreen({ name: "addText" })}
      onOpen={(book) => {
        getText(book.id)
          .then((sections) => (sections ? read(book, sections) : reload()))
          .catch(() => setFailed(true));
      }}
      onRename={(book, title) => {
        renameBook(book.id, title).then(reload, reload);
      }}
      onDelete={(book) => {
        deleteBook(book.id).then(reload, reload);
      }}
    />
  );
}
