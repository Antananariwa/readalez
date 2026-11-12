import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import type { Chapter } from "../core/epub.ts";
import type { Part } from "../core/readingFlow.ts";
import { UNKNOWN_AUTHOR, type BookInfo } from "../core/library.ts";
import { progressPercent } from "../core/position.ts";
import { parsePaste, suggestedTitle } from "../core/paste.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { splitText, type Section, type SplitProgress } from "../core/text.ts";
import { ImportError, readEpub, type ImportProblem } from "./importEpub.ts";

/** A text to add to the library, pasted or imported. */
export interface NewText {
  title: string;
  author: string;
  sections: Section[];
  /** The chapter list; empty for pasted text. */
  chapters: Chapter[];
  /** The reading flow's parts; empty for pasted text, which reads whole. */
  parts: Part[];
  /** `timeWords(splitText(sections))`, worked out once here. */
  timing: Timing;
  /** Where it came from: an imported book goes to the library, a paste opens. */
  from: "epub" | "paste";
}

interface Props {
  /**
   * Saves the text; rejects if it couldn't be stored. Resolves to the copy
   * already in the library when the text is there already, and to null
   * otherwise.
   */
  onSave: (text: NewText) => Promise<BookInfo | null>;
  /** Opens a book in the library. */
  onOpen: (book: BookInfo) => void;
  onBack: () => void;
}

type Problem = "empty" | "storage" | null;

/**
 * The Add text screen (SPEC.md features 1 and 2): Import EPUB, then a paste
 * box and a title field. The title field shows the suggested title until
 * it's typed in; a title left blank saves as the suggestion.
 */
export default function AddText({ onSave, onOpen, onBack }: Props) {
  const [text, setText] = useState("");
  /** The title as typed, or null while it follows the suggested title. */
  const [title, setTitle] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [importProblem, setImportProblem] = useState<
    ImportProblem | "storage" | null
  >(null);
  const [saving, setSaving] = useState(false);
  /** How far an EPUB import has got, or null when none is running. */
  const [importing, setImporting] = useState<SplitProgress | null>(null);
  /** The copy in the library of a text added again. */
  const [existing, setExisting] = useState<BookInfo | null>(null);
  const suggested = useMemo(() => suggestedTitle(text), [text]);
  const fileInput = useRef<HTMLInputElement>(null);

  /**
   * Reads an EPUB on the device and saves it (SPEC.md feature 2), showing
   * its progress (`readEpub`). Back is disabled meanwhile: the import ends
   * by showing the library, which would pull you out of a book opened in
   * between (found reviewing #97).
   */
  const importEpub = async (file: File) => {
    setProblem(null);
    setImportProblem(null);
    setSaving(true);
    const fail = (problem: ImportProblem | "storage") => {
      setImportProblem(problem);
      setImporting(null);
      setSaving(false);
    };
    let book;
    try {
      book = await readEpub(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
        (progress) => flushSync(() => setImporting(progress)),
      );
    } catch (error) {
      fail(error instanceof ImportError ? error.problem : "unreadable");
      return;
    }
    try {
      const copy = await onSave({ ...book, from: "epub" });
      if (copy) {
        setExisting(copy);
        setImporting(null);
        setSaving(false);
      }
    } catch {
      fail("storage");
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const pasted = parsePaste(text);
    const words = splitText(pasted.sections);
    if (words.length === 0) {
      setProblem("empty");
      return;
    }
    setSaving(true);
    try {
      const copy = await onSave({
        title: title?.trim() || pasted.title,
        author: UNKNOWN_AUTHOR,
        sections: pasted.sections,
        chapters: [],
        parts: [],
        timing: timeWords(words),
        from: "paste",
      });
      if (copy) {
        setExisting(copy);
        setSaving(false);
      }
    } catch {
      setProblem("storage");
      setSaving(false);
    }
  };

  return (
    <main className="add-text">
      <nav>
        <button
          type="button"
          className="back"
          disabled={saving}
          onClick={onBack}
        >
          Back
        </button>
      </nav>
      <h1>Add text</h1>
      <div className="import">
        <button
          type="button"
          disabled={saving}
          onClick={() => fileInput.current?.click()}
        >
          Import EPUB
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".epub,application/epub+zip"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            // So picking the same file again still fires a change.
            event.target.value = "";
            if (file) void importEpub(file);
          }}
        />
        {importing && (
          <label className="import-progress">
            Importing…
            <progress value={importing.done} max={importing.total} />
          </label>
        )}
        {importProblem === "unreadable" && (
          <p role="status">Couldn't read this EPUB.</p>
        )}
        {importProblem === "drm" && (
          <p role="status">
            This book is copy-protected (DRM), so Readalez can't open it.
          </p>
        )}
        {importProblem === "empty" && (
          <p role="status">This book has no words to read.</p>
        )}
        {importProblem === "storage" && (
          <p role="status">Couldn't save the book on this device.</p>
        )}
      </div>
      <form onSubmit={save}>
        <label htmlFor="paste">Paste text</label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setProblem(null);
            setImportProblem(null);
          }}
        />
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title ?? suggested}
          onChange={(event) => setTitle(event.target.value)}
        />
        {problem === "empty" && <p role="status">No words to read.</p>}
        {problem === "storage" && (
          <p role="status">Couldn't save the text on this device.</p>
        )}
        <button type="submit" disabled={text.trim() === "" || saving}>
          Save
        </button>
      </form>
      {existing && (
        <AlreadyInLibrary
          book={existing}
          onOpen={() => onOpen(existing)}
          onClose={() => setExisting(null)}
        />
      )}
    </main>
  );
}

/**
 * Says a text or book is already in the library, and offers to open that
 * copy (SPEC.md features 1 and 2).
 */
function AlreadyInLibrary({
  book,
  onOpen,
  onClose,
}: {
  book: BookInfo;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // As in the library's dialog: no cleanup, since an open dialog leaves the
    // top layer when it's removed.
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const reading = book.reading;
  const progress = reading?.finished
    ? "You've finished it."
    : reading && progressPercent(reading.progress) > 0
      ? `You've read ${progressPercent(reading.progress)}% of it.`
      : "You haven't started it yet.";

  return (
    // Escape closes the dialog; `onClose` keeps React's state in step.
    <dialog
      ref={ref}
      className="book-dialog"
      aria-labelledby="already-title"
      onClose={onClose}
    >
      <h2 id="already-title">Already in your library</h2>
      <p>
        “{book.title}” is already in your library. {progress}
      </p>
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={onOpen}>
          Open
        </button>
      </div>
    </dialog>
  );
}
