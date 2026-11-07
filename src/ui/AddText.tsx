import { useMemo, useRef, useState, type FormEvent } from "react";
import { parseEpub, type Chapter } from "../core/epub.ts";
import { UNKNOWN_AUTHOR } from "../core/library.ts";
import { parsePaste, suggestedTitle } from "../core/paste.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { splitText, type Section } from "../core/text.ts";

/** A text to add to the library, pasted or imported. */
export interface NewText {
  title: string;
  author: string;
  sections: Section[];
  /** The chapter list; empty for pasted text. */
  chapters: Chapter[];
  /** `timeWords(splitText(sections))`, worked out once here. */
  timing: Timing;
}

interface Props {
  /** Saves the text; rejects if it couldn't be stored. */
  onSave: (text: NewText) => Promise<void>;
  onBack: () => void;
}

type Problem = "empty" | "storage" | null;
type ImportProblem = Problem | "unreadable";

/**
 * The Add text screen (SPEC.md features 1 and 2): Import EPUB, then a paste
 * box and a title field. The title field shows the suggested title until
 * it's typed in; a title left blank saves as the suggestion.
 */
export default function AddText({ onSave, onBack }: Props) {
  const [text, setText] = useState("");
  /** The title as typed, or null while it follows the suggested title. */
  const [title, setTitle] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [importProblem, setImportProblem] = useState<ImportProblem>(null);
  const [saving, setSaving] = useState(false);
  const suggested = useMemo(() => suggestedTitle(text), [text]);
  const fileInput = useRef<HTMLInputElement>(null);

  /** Reads an EPUB on the device and saves it (SPEC.md feature 2). */
  const importEpub = async (file: File) => {
    setProblem(null);
    setImportProblem(null);
    setSaving(true);
    let book;
    try {
      book = await parseEpub(
        new Uint8Array(await file.arrayBuffer()),
        file.name,
      );
    } catch {
      setImportProblem("unreadable");
      setSaving(false);
      return;
    }
    const words = splitText(book.sections);
    if (words.length === 0) {
      setImportProblem("empty");
      setSaving(false);
      return;
    }
    try {
      await onSave({ ...book, timing: timeWords(words) });
    } catch {
      setImportProblem("storage");
      setSaving(false);
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
      await onSave({
        title: title?.trim() || pasted.title,
        author: UNKNOWN_AUTHOR,
        sections: pasted.sections,
        chapters: [],
        timing: timeWords(words),
      });
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
        {importProblem === "unreadable" && (
          <p role="status">Couldn't read this EPUB.</p>
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
    </main>
  );
}
