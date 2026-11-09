// The chapter list (SPEC.md feature 7, issue #15): every entry of the book's
// chapter list, skipped parts included, in a dialog. Tapping an entry jumps
// to its start. Which entry is current and which are skipped comes from
// src/core/readingFlow.ts.

import { useEffect, useRef } from "react";
import type { Chapter } from "../core/epub.ts";

interface Props {
  chapters: readonly Chapter[];
  /** Index of the entry holding the word on screen, or -1. */
  current: number;
  /** For each entry, true when the reading flow skips it. */
  skipped: readonly boolean[];
  onPick: (entry: number) => void;
  onClose: () => void;
}

export default function ChapterList({
  chapters,
  current,
  skipped,
  onPick,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // No cleanup, as in Library.tsx's dialog.
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    dialog
      ?.querySelector("[aria-current]")
      ?.scrollIntoView({ block: "center" });
  }, []);

  return (
    // Escape closes the dialog; `onClose` keeps React's state in step.
    <dialog
      ref={ref}
      className="chapter-dialog"
      aria-labelledby="chapter-dialog-title"
      onClose={onClose}
    >
      <div className="chapter-dialog-head">
        <h2 id="chapter-dialog-title">Chapters</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <ol className="chapter-list">
        {chapters.map((chapter, i) => (
          <li key={i}>
            <button
              type="button"
              className={skipped[i] ? "skipped" : undefined}
              style={{ paddingLeft: `${0.5 + chapter.depth}rem` }}
              aria-current={i === current ? "true" : undefined}
              onClick={() => onPick(i)}
            >
              {chapter.title}
              {skipped[i] && <span className="skipped-label"> · skipped</span>}
            </button>
          </li>
        ))}
      </ol>
    </dialog>
  );
}
