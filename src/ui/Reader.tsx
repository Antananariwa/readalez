import { useEffect, useMemo } from "react";
import { chapterTexts, wordCount } from "../core/chapterText.ts";
import type { Timing } from "../core/durations.ts";
import type { Section } from "../core/text.ts";
import {
  formatDuration,
  lookUpTimeLeft,
  timeLeftTable,
} from "../core/timeLeft.ts";
import FinishedCard from "./FinishedCard.tsx";
import PausedText from "./PausedText.tsx";
import ProgressBar from "./ProgressBar.tsx";
import { usePlayback, type PlaybackControls } from "./usePlayback.ts";
import RepeatButton from "./RepeatButton.tsx";
import { useSavePosition } from "./useSavePosition.ts";
import { useWakeLock } from "./useWakeLock.ts";
import WordFrame from "./WordFrame.tsx";

interface Props {
  /** The text's sections, for the paused view. */
  sections: readonly Section[];
  /** `timeWords(splitText(sections))`. */
  timing: Timing;
  /** The word to open at, from the saved position (#13). */
  start: number;
  /** Opens on the Finished card, for a book already finished. */
  startFinished: boolean;
  /** Stores the word on screen, or the Finished card; see `useSavePosition`. */
  onSave: (index: number, finished: boolean) => Promise<void>;
  /** Called once the save of the position has finished or failed. */
  onBack: () => void;
}

/**
 * The reader (SPEC.md feature 7): tap the frame to play or pause. Below it,
 * one row changes the speed (held, it keeps changing) and one moves by a
 * sentence; the keyboard does the same. Then the progress bar, and when
 * paused, time left and the chapter's text below; after the last word, the
 * Finished card. Reading pauses when the page is hidden, and the screen stays
 * on while words play. The position is saved as `useSavePosition` says.
 */
export default function Reader({
  sections,
  timing,
  start,
  startFinished,
  onSave,
  onBack,
}: Props) {
  const controls = usePlayback(timing, start, startFinished);
  const {
    index,
    playing,
    finished,
    wpm,
    toggle,
    pause,
    back,
    forward,
    seek,
    moveTo,
    startOver,
    slower,
    faster,
  } = controls;
  useKeys(controls);
  useWakeLock(playing);
  const saveNow = useSavePosition(index, playing, finished, onSave);
  // The library lists the books again after this, so it waits for the save.
  const leave = () => void saveNow().finally(onBack);

  const texts = useMemo(
    () => chapterTexts(sections, timing.words),
    [sections, timing],
  );
  const table = useMemo(() => timeLeftTable(timing, wpm), [timing, wpm]);

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
  if (finished) {
    return (
      <main className="reader">
        <FinishedCard
          words={wordCount(sections)}
          onBack={leave}
          onStartOver={startOver}
        />
      </main>
    );
  }
  const left = lookUpTimeLeft(table, index);
  return (
    <main className="reader">
      <nav>
        <button type="button" className="back" onClick={leave}>
          Back
        </button>
      </nav>
      {word && <WordFrame word={word} playing={playing} onToggle={toggle} />}
      <div className="controls">
        <div className="control-row">
          <RepeatButton label="Slower" onStep={slower}>
            −
          </RepeatButton>
          <span className="control-label" role="status" data-testid="speed">
            {wpm} wpm
          </span>
          <RepeatButton label="Faster" onStep={faster}>
            +
          </RepeatButton>
        </div>
        <div className="control-row">
          <button type="button" aria-label="Previous sentence" onClick={back}>
            <Chevron direction="left" />
          </button>
          <span className="control-label" aria-hidden="true">
            sentence
          </span>
          <button type="button" aria-label="Next sentence" onClick={forward}>
            <Chevron direction="right" />
          </button>
        </div>
      </div>
      <div className="progress-row">
        <ProgressBar index={index} count={timing.words.length} onSeek={seek} />
        {/* Hidden while playing: it takes attention from the words (#68). */}
        {!playing && (
          <p className="time-left">
            <span data-testid="chapter-left">
              {formatDuration(left.chapter)}
            </span>{" "}
            left in chapter ·{" "}
            <span data-testid="book-left">{formatDuration(left.book)}</span>{" "}
            left in book
          </p>
        )}
      </div>
      {!playing && word && (
        <PausedText
          paragraphs={texts[word.section] ?? []}
          index={index}
          paragraph={word.paragraph}
          onTap={moveTo}
        />
      )}
    </main>
  );
}

/**
 * Desktop keys: Space plays or pauses, ← and → move by a sentence, ↑ and ↓
 * change the speed, also with the progress bar focused. Keys with Alt, Ctrl
 * or Meta are left to the browser, and so are keys in text fields. On the
 * Finished card the keys do nothing.
 */
function useKeys(controls: PlaybackControls): void {
  const { finished, toggle, back, forward, slower, faster } = controls;
  useEffect(() => {
    const actions: Record<string, () => void> = {
      " ": toggle,
      ArrowLeft: back,
      ArrowRight: forward,
      ArrowUp: faster,
      ArrowDown: slower,
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (finished) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (
        (target instanceof HTMLInputElement && target.type !== "range") ||
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
  }, [finished, toggle, back, forward, slower, faster]);
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
