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
  nearestSentenceStart,
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
  /** True once the last word has ended, until Start over. */
  finished: boolean;
  /** Words per minute. */
  wpm: number;
  /** Plays from the start of the sentence on screen, or pauses. */
  toggle: () => void;
  pause: () => void;
  /** Moves to the start of the sentence before the one on screen. */
  back: () => void;
  /** Moves to the start of the next sentence. */
  forward: () => void;
  /** Moves to the sentence start nearest word `index` (the progress bar). */
  seek: (index: number) => void;
  /**
   * Moves to word `index` (a tap in the paused view); play then starts
   * exactly there, not at its sentence's start.
   */
  moveTo: (index: number) => void;
  /** Goes back to the first word, paused (the Finished card). */
  startOver: () => void;
  slower: () => void;
  faster: () => void;
}

export function usePlayback(timing: Timing): PlaybackControls {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  // Kept across reloads in #18.
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  // The speed as of the last change, for steps that come faster than
  // renders (a held speed button).
  const speed = useRef(DEFAULT_WPM);
  const playback = useRef<Playback | null>(null);
  // Set by moveTo: the next play starts at the word on screen.
  const exact = useRef(false);
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
        playback.current = null;
        setPlaying(false);
        setFinished(true);
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
    if (finished) return;
    const start = exact.current ? index : sentenceStart(starts, index);
    exact.current = false;
    playback.current = play(timing, start, speed.current, performance.now());
    setIndex(start);
    setPlaying(true);
  }, [playing, finished, index, timing, starts]);

  const jump = useCallback(
    (to: number | null) => {
      if (to === null) return;
      exact.current = false;
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

  const seek = useCallback(
    (to: number) => jump(nearestSentenceStart(starts, to)),
    [jump, starts],
  );
  const moveTo = useCallback(
    (to: number) => {
      jump(to);
      // While playing, the jump already starts at the word.
      exact.current = !playing;
    },
    [jump, playing],
  );
  const startOver = useCallback(() => {
    playback.current = null;
    exact.current = false;
    setIndex(0);
    setPlaying(false);
    setFinished(false);
  }, []);

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

  return {
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
  };
}
