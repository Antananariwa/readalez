// Time left (SPEC.md feature 6): from the same rules at the current speed.

import { wordDuration, type Timing } from "./durations.ts";
import { inFlow, readingFlow, type Flow } from "./readingFlow.ts";

export interface TimeLeft {
  /** Milliseconds to the end of the word's chapter. */
  chapter: number;
  /** Milliseconds of the reading flow's words from the word on (ADR 0011). */
  book: number;
}

/**
 * The index just past the last word of word `index`'s chapter, whose first
 * words are `firstWords` (`chapterBounds` in `readingFlow.ts`), ascending.
 */
function chapterEndAfter(
  firstWords: readonly number[],
  index: number,
  count: number,
): number {
  return firstWords.find((first) => first > index) ?? count;
}

/**
 * The sum of the durations of the words from `index` (included) to the end
 * of its chapter, and of the flow's words from `index` to the end of the
 * book, at `wpm`. Without a flow the whole text is the flow, and without
 * chapter starts it's one chapter.
 */
export function timeLeft(
  timing: Timing,
  index: number,
  wpm: number,
  flow: Flow = readingFlow(timing.words),
  firstWords: readonly number[] = [0],
): TimeLeft {
  const count = timing.words.length;
  const from = Math.max(index, 0);
  const end = chapterEndAfter(firstWords, from, count);
  let chapter = 0;
  let book = 0;
  for (let i = from; i < count; i++) {
    const duration = wordDuration(timing, i, wpm);
    if (inFlow(flow, i)) book += duration;
    if (i < end) chapter += duration;
  }
  return { chapter, book };
}

/**
 * Time left for every word at one speed, worked out once, so the reader can
 * look it up at each word: `timeLeft` walks to the end of the book.
 */
export interface TimeLeftTable {
  /** `left[i]`: milliseconds of all words from word `i` to the end. */
  readonly left: Float64Array;
  /** `flowLeft[i]`: milliseconds of the flow's words from word `i` on. */
  readonly flowLeft: Float64Array;
  /** `chapterEnd[i]`: the index just past the last word of word `i`'s chapter. */
  readonly chapterEnd: Uint32Array;
}

/** Builds the table for `timing` at `wpm`; the flow and chapters as `timeLeft`. */
export function timeLeftTable(
  timing: Timing,
  wpm: number,
  flow: Flow = readingFlow(timing.words),
  firstWords: readonly number[] = [0],
): TimeLeftTable {
  const count = timing.words.length;
  const left = new Float64Array(count + 1);
  const flowLeft = new Float64Array(count + 1);
  const chapterEnd = new Uint32Array(count);
  let next = firstWords.length - 1;
  let end = count;
  for (let i = count - 1; i >= 0; i--) {
    const duration = wordDuration(timing, i, wpm);
    left[i] = left[i + 1]! + duration;
    flowLeft[i] = flowLeft[i + 1]! + (inFlow(flow, i) ? duration : 0);
    // Chapter starts past `i` end the chapter just after `i`'s.
    while (next >= 0 && firstWords[next]! > i) end = firstWords[next--]!;
    chapterEnd[i] = end;
  }
  return { left, flowLeft, chapterEnd };
}

/** The same as `timeLeft` from a table built with the same arguments. */
export function lookUpTimeLeft(table: TimeLeftTable, index: number): TimeLeft {
  const count = table.chapterEnd.length;
  if (index >= count) return { chapter: 0, book: 0 };
  const i = Math.max(index, 0);
  const end = table.chapterEnd[i] ?? count;
  return {
    chapter: table.left[i]! - table.left[end]!,
    book: table.flowLeft[i]!,
  };
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
