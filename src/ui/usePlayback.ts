// The playback loop: asks #7's schedule (src/core/schedule.ts) which word to
// show at each display refresh, and #7's sentence starts
// (src/core/sentences.ts) where to jump. It keeps no timing rules
// of its own.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Timing } from "../core/durations.ts";
import {
  flowIndex,
  flowStart,
  nextWord,
  readingFlow,
  sentenceStartsAround,
  type Flow,
} from "../core/readingFlow.ts";
import {
  isFinished,
  play,
  setSpeed,
  tick,
  type Next,
  type Playback,
} from "../core/schedule.ts";
import {
  nearestSentenceStart,
  nextSentenceStart,
  sentenceStartBefore,
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
  /** Plays from the word on screen, or pauses. */
  toggle: () => void;
  pause: () => void;
  /**
   * Moves to the start of the sentence on screen, or of the one before when
   * the word on screen starts its sentence.
   */
  back: () => void;
  /** Moves to the start of the next sentence. */
  forward: () => void;
  /**
   * Moves to the sentence start nearest the flow's word `ordinal` (the
   * progress bar, which covers the reading flow).
   */
  seek: (ordinal: number) => void;
  /** Moves to word `index` (a tap in the paused view). */
  moveTo: (index: number) => void;
  /** Goes back to the flow's first word, paused (the Finished card). */
  startOver: () => void;
  slower: () => void;
  faster: () => void;
}

/**
 * Playback of `timing`, paused at word `start`, or on the Finished card when
 * `startFinished` is set (a saved place, #13). Reading follows `flow` (#15):
 * it jumps over skipped parts, finishes after the flow's last word, and in a
 * skipped part stops at its end.
 */
export function usePlayback(
  timing: Timing,
  start = 0,
  startFinished = false,
  flow: Flow = readingFlow(timing.words),
): PlaybackControls {
  const [index, setIndex] = useState(start);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(startFinished);
  // Kept across reloads in #18.
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  // The speed as of the last change, for steps that come faster than
  // renders (a held speed button).
  const speed = useRef(DEFAULT_WPM);
  const playback = useRef<Playback | null>(null);
  const starts = useMemo(() => sentenceStarts(timing.words), [timing]);
  const flowStarts = useMemo(
    () => sentenceStartsAround(flow, starts, flowStart(flow)),
    [flow, starts],
  );
  const next = useMemo<Next>(() => (i) => nextWord(flow, i), [flow]);

  useEffect(() => {
    if (!playing) return;
    // Frame timestamps share performance.now()'s clock, which play() starts on.
    let frame = requestAnimationFrame(function step(now) {
      const current = playback.current;
      if (!current) return;
      const after = tick(timing, current, now, next);
      playback.current = after;
      if (isFinished(timing, after)) {
        playback.current = null;
        setPlaying(false);
        setFinished(true);
        return;
      }
      if (after.stopped) {
        // The end of a skipped part (SPEC.md feature 2): paused on its last word.
        playback.current = null;
        setPlaying(false);
        return;
      }
      if (after.index !== current.index) setIndex(after.index);
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, timing, next]);

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (finished) return;
    playback.current = play(timing, index, speed.current, performance.now());
    setPlaying(true);
  }, [playing, finished, index, timing]);

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

  // A sentence move stays in the flow, or in the skipped part it's in.
  const back = useCallback(
    () =>
      jump(
        sentenceStartBefore(sentenceStartsAround(flow, starts, index), index),
      ),
    [jump, flow, starts, index],
  );
  const forward = useCallback(
    () =>
      jump(nextSentenceStart(sentenceStartsAround(flow, starts, index), index)),
    [jump, flow, starts, index],
  );

  const seek = useCallback(
    (ordinal: number) =>
      jump(nearestSentenceStart(flowStarts, flowIndex(flow, ordinal))),
    [jump, flow, flowStarts],
  );
  const startOver = useCallback(() => {
    playback.current = null;
    setIndex(flowStart(flow));
    setPlaying(false);
    setFinished(false);
  }, [flow]);

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
    moveTo: jump,
    startOver,
    slower,
    faster,
  };
}
