import { useMemo, useState, type FormEvent } from "react";
import { parsePaste, suggestedTitle } from "../core/paste.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { splitText, type Section } from "../core/text.ts";

interface Props {
  /**
   * Saves the text; rejects if it couldn't be stored. `timing` is
   * `timeWords(splitText(sections))`, worked out once here.
   */
  onSave: (title: string, sections: Section[], timing: Timing) => Promise<void>;
  onBack: () => void;
}

type Problem = "empty" | "storage" | null;

/**
 * The Add text screen (SPEC.md feature 1): a paste box and a title field.
 * The title field shows the suggested title until it's typed in; a title
 * left blank saves as the suggestion.
 */
export default function AddText({ onSave, onBack }: Props) {
  const [text, setText] = useState("");
  /** The title as typed, or null while it follows the suggested title. */
  const [title, setTitle] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, setSaving] = useState(false);
  const suggested = useMemo(() => suggestedTitle(text), [text]);

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
      await onSave(
        title?.trim() || pasted.title,
        pasted.sections,
        timeWords(words),
      );
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
      <form onSubmit={save}>
        <label htmlFor="paste">Paste text</label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setProblem(null);
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
