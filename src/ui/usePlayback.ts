// The playback loop: asks #7's schedule (src/core/schedule.ts) which word to
// show at each display refresh. It keeps no timing rules of its own.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Timing } from "../core/durations.ts";
import { isFinished, play, tick, type Playback } from "../core/schedule.ts";
import { DEFAULT_WPM } from "../core/timingValues.ts";

export interface PlaybackControls {
  /** The word on screen. It stays on the last word once reading ends. */
  index: number;
  playing: boolean;
  /** Plays from the word on screen, or pauses on it. */
  toggle: () => void;
}

export function usePlayback(timing: Timing): PlaybackControls {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playback = useRef<Playback | null>(null);

  useEffect(() => {
    if (!playing) return;
    // Frame timestamps share performance.now()'s clock, which play() starts on.
    let frame = requestAnimationFrame(function step(now) {
      const current = playback.current;
      if (!current) return;
      const next = tick(timing, current, now);
      playback.current = next;
      if (isFinished(timing, next)) {
        setPlaying(false);
        return;
      }
      if (next.index !== current.index) setIndex(next.index);
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, timing]);

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // After the last word, a tap starts again from the first, until the
    // Finished card arrives (#11).
    const finished =
      playback.current !== null && isFinished(timing, playback.current);
    const start = finished ? 0 : index;
    playback.current = play(timing, start, DEFAULT_WPM, performance.now());
    setIndex(start);
    setPlaying(true);
  }, [playing, index, timing]);

  return { index, playing, toggle };
}
