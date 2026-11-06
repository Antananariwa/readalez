// Saving the reading position (SPEC.md feature 4, issue #13). iOS can close
// a web app in the background without warning, so the position is saved at
// every moment the SPEC lists rather than only when the reader closes.

import { useCallback, useEffect, useRef } from "react";

/**
 * How often the position is saved while words play. SPEC.md feature 4 asks
 * that a reopened book be at most 5 seconds of reading behind; 2 seconds
 * leaves room for a write still in flight and a late timer.
 */
export const SAVE_EVERY_MS = 2000;

/**
 * Saves word `index` (or the Finished card) through `save`: on pause, on
 * every move while paused, every `SAVE_EVERY_MS` while playing, when the page
 * is hidden or unloaded, and when the Finished card shows. Returns a function
 * that saves at once, for leaving the reader.
 */
export function useSavePosition(
  index: number,
  playing: boolean,
  finished: boolean,
  save: (index: number, finished: boolean) => Promise<void>,
): () => Promise<void> {
  const latest = useRef({ index, finished, save });
  useEffect(() => {
    latest.current = { index, finished, save };
  });

  const saveNow = useCallback(() => {
    const { index, finished, save } = latest.current;
    return save(index, finished);
  }, []);

  // Paused, including on the Finished card: each change of place is saved.
  useEffect(() => {
    if (!playing) void saveNow();
  }, [playing, index, finished, saveNow]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => void saveNow(), SAVE_EVERY_MS);
    return () => clearInterval(timer);
  }, [playing, saveNow]);

  useEffect(() => {
    // Saved here too, not only after the pause this causes (`Reader.tsx`):
    // that save waits for a render, which a page being closed may not get to
    // (not checked). Whether a write started here
    // commits before the page goes is unknown; the timer above covers that.
    const onHide = () => {
      if (document.visibilityState === "hidden") void saveNow();
    };
    const onPageHide = () => void saveNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [saveNow]);

  return saveNow;
}
