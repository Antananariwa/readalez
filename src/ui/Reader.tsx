import { useEffect } from "react";
import type { Timing } from "../core/durations.ts";
import { usePlayback, type PlaybackControls } from "./usePlayback.ts";
import { useWakeLock } from "./useWakeLock.ts";
import WordFrame from "./WordFrame.tsx";

interface Props {
  timing: Timing;
  onBack: () => void;
}

/**
 * The reader (SPEC.md feature 7): tap the frame to play or pause, buttons
 * below it to move by a sentence and change the speed, and the same on the
 * keyboard. Reading pauses when the page is hidden, and the screen stays on
 * while words play.
 */
export default function Reader({ timing, onBack }: Props) {
  const controls = usePlayback(timing);
  const { index, playing, wpm, toggle, pause, back, forward, slower, faster } =
    controls;
  useKeys(controls);
  useWakeLock(playing);

  useEffect(() => {
    // Meant to cover the app going to the background, the screen locking and
    // the tab being hidden (not checked on devices: #10's device checks).
    // Reading never resumes on its own.
    const onChange = () => {
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [pause]);

  const word = timing.words[index];
  return (
    <main className="reader">
      <nav>
        <button type="button" className="back" onClick={onBack}>
          Back
        </button>
      </nav>
      {word && <WordFrame word={word} playing={playing} onToggle={toggle} />}
      <div className="controls">
        <button type="button" aria-label="Previous sentence" onClick={back}>
          <Chevron direction="left" />
        </button>
        <button type="button" aria-label="Slower" onClick={slower}>
          −
        </button>
        <span className="speed" role="status" data-testid="speed">
          {wpm} wpm
        </span>
        <button type="button" aria-label="Faster" onClick={faster}>
          +
        </button>
        <button type="button" aria-label="Next sentence" onClick={forward}>
          <Chevron direction="right" />
        </button>
      </div>
    </main>
  );
}

/**
 * Desktop keys: Space plays or pauses, ← and → move by a sentence, ↑ and ↓
 * change the speed. Keys with Alt, Ctrl or Meta are left to the browser.
 */
function useKeys(controls: PlaybackControls): void {
  const { toggle, back, forward, slower, faster } = controls;
  useEffect(() => {
    const actions: Record<string, () => void> = {
      " ": toggle,
      ArrowLeft: back,
      ArrowRight: forward,
      ArrowUp: faster,
      ArrowDown: slower,
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const action = actions[event.key];
      if (!action) return;
      // Stops the page scrolling, and a focused button acting on Space too.
      event.preventDefault();
      if (event.key === " " && event.repeat) return;
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle, back, forward, slower, faster]);
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
