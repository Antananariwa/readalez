import { useMemo, useState, type FormEvent } from "react";
import { APP_NAME } from "../core/appName.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { parsePaste, suggestedTitle } from "../core/paste.ts";
import { splitText, type Section } from "../core/text.ts";

interface Props {
  text: string;
  /** The title as typed, or null while it follows the suggested title. */
  title: string | null;
  onTextChange: (text: string) => void;
  onTitleChange: (title: string) => void;
  onSave: (title: string, sections: Section[], timing: Timing) => void;
}

/**
 * The Add text screen (SPEC.md feature 1): a paste box and a title field.
 * The title field shows the suggested title until it's typed in; a title
 * left blank saves as the suggestion.
 */
export default function AddText({
  text,
  title,
  onTextChange,
  onTitleChange,
  onSave,
}: Props) {
  const [empty, setEmpty] = useState(false);
  const suggested = useMemo(() => suggestedTitle(text), [text]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const pasted = parsePaste(text);
    const words = splitText(pasted.sections);
    if (words.length === 0) {
      setEmpty(true);
      return;
    }
    onSave(title?.trim() || pasted.title, pasted.sections, timeWords(words));
  };

  return (
    <main className="add-text">
      <h1>{APP_NAME}</h1>
      <form onSubmit={save}>
        <label htmlFor="paste">Paste text</label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => {
            onTextChange(event.target.value);
            setEmpty(false);
          }}
        />
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title ?? suggested}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        {empty && <p role="status">No words to read.</p>}
        <button type="submit" disabled={text.trim() === ""}>
          Save
        </button>
      </form>
    </main>
  );
}
