import type { Timing } from "../core/durations.ts";
import { usePlayback } from "./usePlayback.ts";
import WordFrame from "./WordFrame.tsx";

interface Props {
  timing: Timing;
  onBack: () => void;
}

/** The reader: tap the frame to play or pause. Other controls come in #10. */
export default function Reader({ timing, onBack }: Props) {
  const { index, playing, toggle } = usePlayback(timing);
  const word = timing.words[index];
  return (
    <main className="reader">
      <nav>
        <button type="button" className="back" onClick={onBack}>
          Back
        </button>
      </nav>
      {word && <WordFrame word={word} playing={playing} onToggle={toggle} />}
    </main>
  );
}
