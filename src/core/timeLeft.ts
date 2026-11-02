// Time left (SPEC.md feature 6): from the same rules at the current speed.

import { wordDuration, type Timing } from "./durations.ts";

export interface TimeLeft {
  /** Milliseconds to the end of the chapter (the word's section). */
  chapter: number;
  /** Milliseconds to the end of the book. */
  book: number;
}

/**
 * The sum of the durations of the words from `index` (included) to the end
 * of its chapter and of the book, at `wpm`.
 */
export function timeLeft(timing: Timing, index: number, wpm: number): TimeLeft {
  const section = timing.words[index]?.section;
  let chapter = 0;
  let book = 0;
  for (let i = Math.max(index, 0); i < timing.words.length; i++) {
    const duration = wordDuration(timing, i, wpm);
    book += duration;
    if (timing.words[i]?.section === section) chapter += duration;
  }
  return { chapter, book };
}
