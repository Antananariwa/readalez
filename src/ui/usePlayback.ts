// The playback loop: asks #7's schedule (src/core/schedule.ts) which word to
// show at each display refresh, and #7's sentence starts
// (src/core/sentences.ts) where to resume and jump. It keeps no timing rules
// of its own.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Timing } from "../core/durations.ts";
import {
  isFinished,
  play,
  setSpeed,
  tick,
  type Playback,
} from "../core/schedule.ts";
import {
  nextSentenceStart,
  previousSentenceStart,
  sentenceStart,
  sentenceStarts,
} from "../core/sentences.ts";
import { DEFAULT_WPM, stepSpeed } from "../core/timingValues.ts";

export interface PlaybackControls {
  /** The word on screen. It stays on the last word once reading ends. */
  index: number;
  playing: boolean;
  /** Words per minute. */
  wpm: number;
  /** Plays from the start of the sentence on screen, or pauses. */
  toggle: () => void;
  pause: () => void;
  /** Moves to the start of the sentence before the one on screen. */
  back: () => void;
  /** Moves to the start of the next sentence. */
  forward: () => void;
  slower: () => void;
  faster: () => void;
}

export function usePlayback(timing: Timing): PlaybackControls {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Kept across reloads in #18.
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  // The speed as of the last change, for steps that come faster than
  // renders (a held speed button).
  const speed = useRef(DEFAULT_WPM);
  const playback = useRef<Playback | null>(null);
  const starts = useMemo(() => sentenceStarts(timing.words), [timing]);

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

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // After the last word, a tap starts again from the first, until the
    // Finished card arrives (#11).
    const finished =
      playback.current !== null && isFinished(timing, playback.current);
    const start = finished ? 0 : sentenceStart(starts, index);
    playback.current = play(timing, start, speed.current, performance.now());
    setIndex(start);
    setPlaying(true);
  }, [playing, index, timing, starts]);

  const jump = useCallback(
    (to: number | null) => {
      if (to === null) return;
      setIndex(to);
      // While playing, the schedule starts again at the new word, which gets
      // the start factor (SPEC.md feature 6). While paused, play starts there.
      playback.current = playing
        ? play(timing, to, speed.current, performance.now())
        : null;
    },
    [playing, timing],
  );

  const back = useCallback(
    () => jump(previousSentenceStart(starts, index)),
    [jump, starts, index],
  );
  const forward = useCallback(
    () => jump(nextSentenceStart(starts, index)),
    [jump, starts, index],
  );

  const changeSpeed = useCallback((steps: number) => {
    const next = stepSpeed(speed.current, steps);
    speed.current = next;
    setWpm(next);
    // While playing, applies from the next word.
    if (playback.current) {
      playback.current = setSpeed(playback.current, next);
    }
  }, []);
  const slower = useCallback(() => changeSpeed(-1), [changeSpeed]);
  const faster = useCallback(() => changeSpeed(1), [changeSpeed]);

  return { index, playing, wpm, toggle, pause, back, forward, slower, faster };
}
