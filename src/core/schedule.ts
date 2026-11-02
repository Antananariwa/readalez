// Playback schedule (SPEC.md feature 6): which word shows at a given moment.
// No timers: the caller passes in the time of each frame (#8 uses the
// requestAnimationFrame timestamp), so tests run on a fake clock.

import { wordDuration, type Timing } from "./durations.ts";
import { clampSpeed } from "./timingValues.ts";

export interface Playback {
  /** The word on screen; `timing.words.length` once the last word has ended. */
  readonly index: number;
  /** When the word on screen is due to end, in the caller's milliseconds. */
  readonly endsAt: number;
  /** Words per minute for the next word. */
  readonly wpm: number;
}

/**
 * Starts playing at word `index` at time `now`. The first word shows for at
 * least the start factor's time.
 */
export function play(
  timing: Timing,
  index: number,
  wpm: number,
  now: number,
): Playback {
  const speed = clampSpeed(wpm);
  if (index >= timing.words.length) {
    return { index: timing.words.length, endsAt: now, wpm: speed };
  }
  return {
    index,
    endsAt: now + wordDuration(timing, index, speed, true),
    wpm: speed,
  };
}

/** True once the last word has ended. */
export function isFinished(timing: Timing, playback: Playback): boolean {
  return playback.index >= timing.words.length;
}

/**
 * Moves on at a frame, at most one word per call, so every word is on
 * screen for at least one frame. Each word ends a fixed time after the one
 * before it was due to end, so late frames don't add up. If that time has
 * already passed (the device stalled), the word is timed from `now`
 * instead: reading slows down rather than skipping words.
 */
export function tick(
  timing: Timing,
  playback: Playback,
  now: number,
): Playback {
  if (isFinished(timing, playback) || now < playback.endsAt) return playback;
  const index = playback.index + 1;
  if (index >= timing.words.length) return { ...playback, index };
  const duration = wordDuration(timing, index, playback.wpm);
  const due = playback.endsAt + duration;
  return { index, endsAt: due > now ? due : now + duration, wpm: playback.wpm };
}

/** Changes the speed; it applies from the next word. */
export function setSpeed(playback: Playback, wpm: number): Playback {
  return { ...playback, wpm: clampSpeed(wpm) };
}
