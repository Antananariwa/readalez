import { useEffect, useMemo, useState } from "react";
import { chapterText, chapterTexts, wordCount } from "../core/chapterText.ts";
import type { Timing } from "../core/durations.ts";
import type { Chapter } from "../core/epub.ts";
import {
  chapterAt,
  chapterBounds,
  entryAt,
  firstWordAt,
  flowOrdinal,
  skippedEntries,
  type Flow,
  type Part,
} from "../core/readingFlow.ts";
import type { Section } from "../core/text.ts";
import {
  formatDuration,
  lookUpTimeLeft,
  timeLeftTable,
} from "../core/timeLeft.ts";
import ChapterList from "./ChapterList.tsx";
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
  /** The chapter list; empty for pasted text. */
  chapters: readonly Chapter[];
  /** The reading flow's parts (ADR 0011); empty when it's the whole text. */
  parts: readonly Part[];
  /** `readingFlow(timing.words, parts)`. */
  flow: Flow;
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
 * sentence; the keyboard does the same. Then the progress bar over the
 * reading flow, and when paused, time left and the chapter's text below;
 * after the flow's last word, the Finished card. Chapters, beside Back, opens
 * the chapter list. Reading pauses when the page is hidden, and the screen
 * stays on while words play. The position is saved as `useSavePosition` says.
 */
export default function Reader({
  sections,
  timing,
  chapters,
  parts,
  flow,
  start,
  startFinished,
  onSave,
  onBack,
}: Props) {
  const bounds = useMemo(
    () => chapterBounds(timing.words, chapters, parts),
    [timing, chapters, parts],
  );
  const entryWords = useMemo(
    () => chapters.map((chapter) => firstWordAt(timing.words, chapter)),
    [timing, chapters],
  );
  const controls = usePlayback(timing, start, startFinished, flow);
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
  const table = useMemo(
    () => timeLeftTable(timing, wpm, flow, bounds.firstWords),
    [timing, wpm, flow, bounds],
  );
  const chapter = chapterAt(bounds, index);
  const shown = useMemo(
    () =>
      chapterText(texts, bounds.places[chapter]!, bounds.places[chapter + 1]),
    [texts, bounds, chapter],
  );
  const [listOpen, setListOpen] = useState(false);

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
          words={wordCount(sections, parts)}
          onBack={leave}
          onStartOver={startOver}
        />
      </main>
    );
  }
  const left = lookUpTimeLeft(table, index);
  const count = timing.words.length;
  return (
    <main className="reader">
      <nav className="reader-nav">
        <button type="button" className="back" onClick={leave}>
          Back
        </button>
        {chapters.length > 0 && (
          <button
            type="button"
            className="back"
            onClick={() => {
              pause();
              setListOpen(true);
            }}
          >
            Chapters
          </button>
        )}
      </nav>
      {listOpen && (
        <ChapterList
          chapters={chapters}
          current={entryAt(entryWords, index)}
          skipped={skippedEntries(flow, entryWords)}
          onPick={(entry) => {
            setListOpen(false);
            moveTo(Math.min(entryWords[entry]!, count - 1));
          }}
          onClose={() => setListOpen(false)}
        />
      )}
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
        <ProgressBar
          index={Math.min(
            flowOrdinal(flow, index),
            Math.max(flow.count - 1, 0),
          )}
          count={flow.count}
          disabled={playing}
          onSeek={seek}
        />
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
          paragraphs={shown.paragraphs}
          index={index}
          paragraph={shown.places.findIndex(
            (place) =>
              place.section === word.section &&
              place.paragraph === word.paragraph,
          )}
          onTap={moveTo}
        />
      )}
    </main>
  );
}

/**
 * Desktop keys: Space plays or pauses, ← and → move by a sentence, ↑ and ↓
 * change the speed, also with the progress bar focused. Keys with Alt, Ctrl
 * or Meta are left to the browser, and so are keys in text fields and in the
 * chapter list. On the Finished card the keys do nothing.
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
      // The chapter list's own keys.
      if (event.target instanceof Element && event.target.closest("dialog")) {
        return;
      }
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
