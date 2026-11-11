import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { DrmError, parseEpub, type Chapter } from "../core/epub.ts";
import type { Part } from "../core/readingFlow.ts";
import { UNKNOWN_AUTHOR, type BookInfo } from "../core/library.ts";
import { progressPercent } from "../core/position.ts";
import { parsePaste, suggestedTitle } from "../core/paste.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import {
  splitText,
  splitTextInSteps,
  type Section,
  type SplitProgress,
  type Word,
} from "../core/text.ts";

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
type ImportProblem = Problem | "unreadable" | "drm";

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
  const [importProblem, setImportProblem] = useState<ImportProblem>(null);
  const [saving, setSaving] = useState(false);
  /** How far an EPUB import has got, or null when none is running. */
  const [importing, setImporting] = useState<SplitProgress | null>(null);
  /** The copy in the library of a text added again. */
  const [existing, setExisting] = useState<BookInfo | null>(null);
  const suggested = useMemo(() => suggestedTitle(text), [text]);
  const fileInput = useRef<HTMLInputElement>(null);

  /**
   * Reads an EPUB on the device and saves it (SPEC.md feature 2). The page
   * stays frozen while it works, apart from redrawing the progress bar
   * between steps of splitting the text (docs/known-issues.md).
   */
  const importEpub = async (file: File) => {
    setProblem(null);
    setImportProblem(null);
    setSaving(true);
    const fail = (problem: ImportProblem) => {
      setImportProblem(problem);
      setImporting(null);
      setSaving(false);
    };
    await showProgress({ done: 0, total: 1 });
    let book;
    try {
      book = await parseEpub(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
      );
    } catch (error) {
      fail(error instanceof DrmError ? "drm" : "unreadable");
      return;
    }
    let words: Word[];
    const steps = splitTextInSteps(book.sections);
    for (;;) {
      const step = steps.next();
      if (step.done) {
        words = step.value;
        break;
      }
      await showProgress(step.value);
    }
    if (words.length === 0) {
      fail("empty");
      return;
    }
    await showProgress({ done: 1, total: 1 });
    try {
      const copy = await onSave({
        ...book,
        timing: timeWords(words),
        from: "epub",
      });
      if (copy) {
        setExisting(copy);
        setImporting(null);
        setSaving(false);
      }
    } catch {
      fail("storage");
    }
  };

  /**
   * Shows `progress` on the bar, then ends the current task, so the browser
   * can draw the bar before the next step.
   */
  const showProgress = async (progress: SplitProgress) => {
    flushSync(() => setImporting(progress));
    await nextTask();
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
        <button type="button" className="back" onClick={onBack}>
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

/**
 * Resolves in a new task, posted through a `MessageChannel`, as React's
 * scheduler does when it yields to the browser between tasks. It prefers a
 * `MessageChannel` to `setTimeout` because of setTimeout's 4 ms clamping:
 * https://github.com/facebook/react/blob/e8738f0c628b4c321c5ce8077390ba48a8208341/packages/scheduler/src/forks/Scheduler.js#L452-L453
 * https://github.com/facebook/react/blob/e8738f0c628b4c321c5ce8077390ba48a8208341/packages/scheduler/src/forks/Scheduler.js#L546-L552
 * Unlike `requestAnimationFrame`, it also runs while the page is hidden, and
 * while a test's clock is paused (#16).
 */
function nextTask(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}
