import { useState } from "react";
import type { Timing } from "../core/durations.ts";
import AddText from "./AddText.tsx";
import Reader from "./Reader.tsx";

interface Saved {
  title: string;
  timing: Timing;
}

/**
 * Two screens, Add text and Reader, in memory only until the library (#12),
 * which will also show the saved title. The pasted text and title stay when
 * the reader leads back.
 */
export default function App() {
  const [text, setText] = useState("");
  const [title, setTitle] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  if (saved) {
    return <Reader timing={saved.timing} onBack={() => setSaved(null)} />;
  }
  return (
    <AddText
      text={text}
      title={title}
      onTextChange={setText}
      onTitleChange={setTitle}
      onSave={(savedTitle, timing) => setSaved({ title: savedTitle, timing })}
    />
  );
}
