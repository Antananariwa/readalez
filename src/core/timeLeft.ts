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

/**
 * Time left for every word at one speed, worked out once, so the reader can
 * look it up at each word: `timeLeft` walks to the end of the book.
 */
export interface TimeLeftTable {
  /** `left[i]`: milliseconds from word `i` to the end of the book. */
  readonly left: Float64Array;
  /** `chapterEnd[i]`: the index just past the last word of word `i`'s section. */
  readonly chapterEnd: Uint32Array;
}

/** Builds the table for `timing` at `wpm`. */
export function timeLeftTable(timing: Timing, wpm: number): TimeLeftTable {
  const count = timing.words.length;
  const left = new Float64Array(count + 1);
  const chapterEnd = new Uint32Array(count);
  let end = count;
  for (let i = count - 1; i >= 0; i--) {
    left[i] = (left[i + 1] ?? 0) + wordDuration(timing, i, wpm);
    if (timing.words[i + 1]?.section !== timing.words[i]?.section) end = i + 1;
    chapterEnd[i] = end;
  }
  return { left, chapterEnd };
}

/** The same as `timeLeft(timing, index, wpm)`, from a table built at `wpm`. */
export function lookUpTimeLeft(table: TimeLeftTable, index: number): TimeLeft {
  const count = table.chapterEnd.length;
  if (index >= count) return { chapter: 0, book: 0 };
  const i = Math.max(index, 0);
  const book = table.left[i] ?? 0;
  const end = table.chapterEnd[i] ?? count;
  return { chapter: book - (table.left[end] ?? 0), book };
}

/**
 * A time as the reader shows it: `m:ss`, or `h:mm:ss` from an hour, rounded
 * up to the second, so it reaches 0:00 only when no time is left. Seconds
 * show because the device check times a chapter to within 2% (#11).
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  if (hours === 0) return `${minutes}:${seconds}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
}
