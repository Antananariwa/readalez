import { useEffect, useRef, useState, type FormEvent } from "react";
import { APP_NAME } from "../core/appName.ts";
import { BUILT_IN_BOOKS } from "../core/builtInBooks.ts";
import {
  bookSource,
  libraryOrder,
  type BookInfo,
  type BookSource,
} from "../core/library.ts";
import {
  bookTimeLeft,
  progressPercent,
  type Reading,
} from "../core/position.ts";
import type { SplitProgress } from "../core/text.ts";
import { formatDuration } from "../core/timeLeft.ts";
import type { OfflineBooks } from "./useOfflineBooks.ts";
import { DEFAULT_WPM } from "../core/timingValues.ts";

interface Props {
  /** Null while the library is loading. */
  books: readonly BookInfo[] | null;
  /** Set when the library couldn't be read from the device. */
  failed: boolean;
  /** The book just imported, marked New (SPEC.md feature 2). */
  newId: string | null;
  /** A built-in book being imported on its first open, with its progress. */
  opening: { id: string; progress: SplitProgress } | null;
  /** Set when a built-in book couldn't be opened. */
  openFailed: boolean;
  /** The chip that's on: every book, or only one source's. */
  source: LibraryFilter;
  onSource: (source: LibraryFilter) => void;
  /** How far saving the built-in books for offline use has got. */
  offline: OfflineBooks;
  onAdd: () => void;
  onOpen: (book: BookInfo) => void;
  onRename: (book: BookInfo, title: string) => void;
  onDelete: (book: BookInfo) => void;
}

const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** Standard Ebooks' one-line summary of each built-in book, by slug. */
const summaries = new Map(BUILT_IN_BOOKS.map((b) => [b.slug, b.summary]));

/** What the library shows: every book, or only one source's. */
export type LibraryFilter = "all" | BookSource;

/** The chips, one always on (SPEC.md feature 4). */
const SOURCES: [LibraryFilter, string][] = [
  ["all", "All"],
  ["public", "Public"],
  ["mine", "My books"],
];

/**
 * The library (SPEC.md features 3 and 4), the home screen: every text with
 * its title, author, progress, time left and when it was last opened, most
 * recently opened first. A book just imported is marked New. Three chips, one
 * always on, show every book, only the built-in ones (Public) or only
 * your own. Each of your own texts has an options button that opens a
 * dialog to rename or delete it; built-in books have none.
 */
export default function Library({
  books,
  failed,
  newId,
  opening,
  openFailed,
  source,
  onSource,
  offline,
  onAdd,
  onOpen,
  onRename,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState<BookInfo | null>(null);
  const shown =
    books &&
    libraryOrder(
      source === "all"
        ? books
        : books.filter((book) => bookSource(book) === source),
    );
  const busy = opening !== null;

  return (
    <main className="library">
      <OfflineBanner offline={offline} />
      <h1>{APP_NAME}</h1>
      <button type="button" className="add" disabled={busy} onClick={onAdd}>
        Add text
      </button>
      <div className="sources" role="group" aria-label="Show">
        {SOURCES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={source === value}
            onClick={() => onSource(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {failed && <p role="status">Couldn't read the library on this device.</p>}
      {openFailed && <p role="status">Couldn't open this book.</p>}
      {shown && shown.length === 0 && (
        <p>
          {source === "mine" ? "No texts of your own yet." : "No texts yet."}
        </p>
      )}
      {shown && shown.length > 0 && (
        <ul className="books" aria-label="Library">
          {shown.map((book) => (
            <li key={book.id} className={book.id === newId ? "new" : undefined}>
              <button
                type="button"
                className="book"
                disabled={busy}
                onClick={() => onOpen(book)}
              >
                <span className="book-title">{book.title}</span>
                <span className="book-author">{book.author}</span>
                {book.builtIn !== undefined && (
                  <span className="book-summary">
                    {summaries.get(book.builtIn)}
                  </span>
                )}
                {book.reading && <Progress reading={book.reading} />}
                <span className="book-opened">
                  {book.openedAt === undefined
                    ? "Not opened yet"
                    : `Opened ${date.format(book.openedAt)}`}
                </span>
                {opening?.id === book.id && (
                  // A span, since a label can't sit inside a button.
                  <span className="book-opening">
                    Opening…
                    <progress
                      aria-label={`Opening ${book.title}`}
                      value={opening.progress.done}
                      max={opening.progress.total}
                    />
                  </span>
                )}
              </button>
              {book.id === newId && <span className="new-label">New</span>}
              {book.builtIn === undefined && (
                <button
                  type="button"
                  className="options"
                  disabled={busy}
                  aria-label={`Options for ${book.title}`}
                  onClick={() => setEditing(book)}
                >
                  ⋯
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <BookDialog
          book={editing}
          onClose={() => setEditing(null)}
          onRename={(title) => {
            onRename(editing, title);
            setEditing(null);
          }}
          onDelete={() => {
            onDelete(editing);
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}

/**
 * A band at the top while the built-in books download for offline use, then
 * "Ready to use offline" for the rest of the visit, or that saving failed.
 * Why: SPEC.md feature 12.
 */
function OfflineBanner({ offline }: { offline: OfflineBooks }) {
  if (offline.state === "hidden") return null;
  return (
    <div className="offline-banner" role="status">
      {offline.state === "ready" ? (
        "Ready to use offline."
      ) : offline.state === "failed" ? (
        "Couldn't save the books for offline use. Reload the page to try again."
      ) : (
        <>
          <span>
            Saving books for offline use: {offline.saved} of {offline.total}.
            Stay online until it's done.
          </span>
          <progress
            aria-label="Saving books for offline use"
            value={offline.saved}
            max={offline.total}
          />
        </>
      )}
    </div>
  );
}

/**
 * "Finished", or the progress and the time left. Time left is at the default
 * speed until the speed is stored (#18).
 */
function Progress({ reading }: { reading: Reading }) {
  if (reading.finished) {
    return (
      <span className="book-progress" data-testid="book-progress">
        Finished
      </span>
    );
  }
  return (
    <span className="book-progress">
      <span data-testid="book-progress">
        {progressPercent(reading.progress)}%
      </span>{" "}
      ·{" "}
      <span data-testid="book-left">
        {formatDuration(bookTimeLeft(reading.left, DEFAULT_WPM))}
      </span>{" "}
      left
    </span>
  );
}

/**
 * Renames a text, or deletes it after a confirmation. A title left blank
 * keeps the old one.
 */
function BookDialog({
  book,
  onClose,
  onRename,
  onDelete,
}: {
  book: BookInfo;
  onClose: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(book.title);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // No cleanup: an open dialog leaves the top layer when it's removed, and
    // closing it here would fire `close` after StrictMode's second run.
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "" || trimmed === book.title) onClose();
    else onRename(trimmed);
  };

  return (
    // Escape closes the dialog; `onClose` keeps React's state in step.
    <dialog
      ref={ref}
      className="book-dialog"
      aria-labelledby="book-dialog-title"
      onClose={onClose}
    >
      {confirming ? (
        <>
          <h2 id="book-dialog-title">Delete “{book.title}”?</h2>
          <p>Its text is removed from this device.</p>
          <div className="dialog-actions">
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={save}>
          <h2 id="book-dialog-title">{book.title}</h2>
          <label htmlFor="rename">Title</label>
          <input
            id="rename"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
          <button
            type="button"
            className="danger"
            onClick={() => setConfirming(true)}
          >
            Delete…
          </button>
        </form>
      )}
    </dialog>
  );
}
