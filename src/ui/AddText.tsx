import { useState, type FormEvent } from "react";
import { APP_NAME } from "../core/appName.ts";
import { timeWords, type Timing } from "../core/durations.ts";
import { pastedSections } from "../core/paste.ts";
import { splitText } from "../core/text.ts";

interface Props {
  text: string;
  onChange: (text: string) => void;
  onRead: (timing: Timing) => void;
}

/** The Add text screen: a paste box. Feature 1's full rules come in #9. */
export default function AddText({ text, onChange, onRead }: Props) {
  const [empty, setEmpty] = useState(false);

  const read = (event: FormEvent) => {
    event.preventDefault();
    const words = splitText(pastedSections(text));
    if (words.length === 0) {
      setEmpty(true);
      return;
    }
    onRead(timeWords(words));
  };

  return (
    <main className="add-text">
      <h1>{APP_NAME}</h1>
      <form onSubmit={read}>
        <label htmlFor="paste">Paste text</label>
        <textarea
          id="paste"
          value={text}
          onChange={(event) => {
            onChange(event.target.value);
            setEmpty(false);
          }}
        />
        {empty && <p role="status">No words to read.</p>}
        <button type="submit" disabled={text.trim() === ""}>
          Read
        </button>
      </form>
    </main>
  );
}
