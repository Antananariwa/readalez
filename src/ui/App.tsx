import { useCallback, useEffect, useState } from "react";
import { bookId } from "../core/bookId.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { UNKNOWN_AUTHOR, type BookInfo } from "../core/library.ts";
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
} from "./storage.ts";

type Screen =
  | { name: "library" }
  | { name: "addText" }
  | { name: "reader"; sections: Section[]; timing: Timing };

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

  const read = async (
    id: string,
    sections: Section[],
    timing = timeWords(splitText(sections)),
  ) => {
    await markOpened(id, Date.now());
    setScreen({ name: "reader", sections, timing });
  };

  const back = () => {
    setScreen({ name: "library" });
    reload();
  };

  if (screen.name === "reader") {
    return (
      <Reader sections={screen.sections} timing={screen.timing} onBack={back} />
    );
  }
  if (screen.name === "addText") {
    return (
      <AddText
        onBack={() => setScreen({ name: "library" })}
        onSave={async (title, sections, timing) => {
          // A text already in the library opens the copy there (SPEC.md
          // feature 1).
          const added: BookInfo = {
            id: bookId(sections),
            title,
            author: UNKNOWN_AUTHOR,
            addedAt: Date.now(),
          };
          const book = await addBook(added, sections);
          if (book === added) {
            await read(book.id, sections, timing);
          } else {
            await read(book.id, (await getText(book.id)) ?? sections);
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
          .then((sections) => (sections ? read(book.id, sections) : reload()))
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
