// The progress bar (SPEC.md feature 7): a native range input over the words.
// Dragging moves only the bar; letting go asks for the sentence start
// nearest the point (usePlayback's `seek`).

import { useEffect, useRef, useState } from "react";

interface Props {
  /** The word on screen. */
  index: number;
  /** The number of words. */
  count: number;
  onSeek: (index: number) => void;
}

export default function ProgressBar({ index, count, onSeek }: Props) {
  const input = useRef<HTMLInputElement>(null);
  // The bar's place while it's dragged, or null when it follows the word.
  const [dragged, setDragged] = useState<number | null>(null);

  // React's onChange fires on every move (the input event); the native change
  // event fires when the bar is let go, but only if its value changed. A drag
  // let go where it started (#11's review) fires none, so letting go there
  // just hands the bar back to the word.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    let start: string | null = null;
    const onChange = () => {
      start = null;
      setDragged(null);
      onSeek(Number(el.value));
    };
    const onDown = () => {
      start = el.value;
    };
    const onUp = () => {
      if (start !== null && el.value === start) setDragged(null);
      start = null;
    };
    el.addEventListener("change", onChange);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("change", onChange);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onSeek]);

  const value = dragged ?? index;
  const last = Math.max(count - 1, 0);
  const percent = last === 0 ? 0 : Math.round((value / last) * 100);
  return (
    <input
      ref={input}
      className="progress"
      type="range"
      aria-label="Progress"
      aria-valuetext={`${percent}%`}
      min={0}
      max={last}
      step={1}
      value={value}
      onChange={(event) => setDragged(Number(event.target.value))}
    />
  );
}
