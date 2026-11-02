import { useState } from "react";
import type { Timing } from "../core/durations.ts";
import AddText from "./AddText.tsx";
import Reader from "./Reader.tsx";

/**
 * Two screens, Add text and Reader, in memory only until the library (#12).
 * The pasted text stays when the reader leads back.
 */
export default function App() {
  const [text, setText] = useState("");
  const [timing, setTiming] = useState<Timing | null>(null);
  if (timing) return <Reader timing={timing} onBack={() => setTiming(null)} />;
  return <AddText text={text} onChange={setText} onRead={setTiming} />;
}
