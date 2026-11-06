import { useEffect, useRef, useState, type FormEvent } from "react";
import { APP_NAME } from "../core/appName.ts";
import { libraryOrder, type BookInfo } from "../core/library.ts";
import {
  bookTimeLeft,
  progressPercent,
  type Reading,
} from "../core/position.ts";
import { formatDuration } from "../core/timeLeft.ts";
import { DEFAULT_WPM } from "../core/timingValues.ts";

interface Props {
  /** Null while the library is loading. */
  books: readonly BookInfo[] | null;
  /** Set when the library couldn't be read from the device. */
  failed: boolean;
  onAdd: () => void;
  onOpen: (book: BookInfo) => void;
  onRename: (book: BookInfo, title: string) => void;
  onDelete: (book: BookInfo) => void;
}

const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/**
 * The library (SPEC.md feature 4), the home screen: every text with its
 * title, author, progress, time left and when it was last opened, most
 * recently opened first.
 * Each text's options button opens a dialog to rename or delete it.
 */
export default function Library({
  books,
  failed,
  onAdd,
  onOpen,
  onRename,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState<BookInfo | null>(null);

  return (
    <main className="library">
      <h1>{APP_NAME}</h1>
      <button type="button" className="add" onClick={onAdd}>
        Add text
      </button>
      {failed && <p role="status">Couldn't read the library on this device.</p>}
      {books && books.length === 0 && <p>No texts yet.</p>}
      {books && books.length > 0 && (
        <ul className="books" aria-label="Library">
          {libraryOrder(books).map((book) => (
            <li key={book.id}>
              <button
                type="button"
                className="book"
                onClick={() => onOpen(book)}
              >
                <span className="book-title">{book.title}</span>
                <span className="book-author">{book.author}</span>
                {book.reading && <Progress reading={book.reading} />}
                <span className="book-opened">
                  {book.openedAt === undefined
                    ? "Not opened yet"
                    : `Opened ${date.format(book.openedAt)}`}
                </span>
              </button>
              <button
                type="button"
                className="options"
                aria-label={`Options for ${book.title}`}
                onClick={() => setEditing(book)}
              >
                ⋯
              </button>
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
