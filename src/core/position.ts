// Reading positions and progress (SPEC.md feature 4, issue #13): where a
// book's reading stopped, finding that place again after the splitting rules
// change, and the progress and time left the library shows without splitting
// the book's text again (ADR 0008).

import { factorDuration, type Timing } from "./durations.ts";

/**
 * A place in a book by section, paragraph and word, the indices `Word`
 * carries. Paragraph indices count paragraphs that show no words, so a
 * position keeps its paragraph when the splitting rules change.
 */
export interface Position {
  section: number;
  paragraph: number;
  /** The shown word's index within its paragraph. */
  word: number;
}

/** What is stored about reading a book (ADR 0008). */
export interface Reading {
  /** The word on screen when it was saved. */
  position: Position;
  /** True once the Finished card has shown, until Start over. */
  finished: boolean;
  /** 0 at the first word, 1 at the Finished card. */
  progress: number;
  /**
   * The words from the position to the end, as [factor, count] pairs: how
   * many words have each timing factor. Empty once finished. Time left at any
   * speed comes from it (`bookTimeLeft`).
   */
  left: [factor: number, count: number][];
}

export function positionOf(word: Position): Position {
  return { section: word.section, paragraph: word.paragraph, word: word.word };
}

/** -1, 0 or 1 as `a` comes before, at or after `b`. */
function compare(a: Position, b: Position): number {
  return (
    Math.sign(a.section - b.section) ||
    Math.sign(a.paragraph - b.paragraph) ||
    Math.sign(a.word - b.word)
  );
}

function sameParagraph(a: Position, b: Position): boolean {
  return a.section === b.section && a.paragraph === b.paragraph;
}

/**
 * The index in `words` (in reading order, as `splitText` gives them) of a
 * saved position. When the splitting rules have changed since it was saved,
 * it lands in the same paragraph: a word index past the paragraph's end
 * becomes its last word. A paragraph that now shows no words gives the next
 * word after it, and a place past the end gives the last word.
 */
export function findPosition(
  words: readonly Position[],
  position: Position,
): number {
  // The first word at or after the position.
  let low = 0;
  let high = words.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (compare(words[mid]!, position) < 0) low = mid + 1;
    else high = mid;
  }
  const at = words[low];
  if (at && sameParagraph(at, position)) return low;
  const before = words[low - 1];
  if (before && sameParagraph(before, position)) return low - 1;
  return at ? low : Math.max(words.length - 1, 0);
}

/**
 * Each word's timing factor as an index into the book's few distinct
 * factors, worked out once per text so that saving a position, every few
 * seconds while playing, is one quick pass over small numbers.
 */
export interface ProgressTable {
  readonly factors: readonly number[];
  readonly ids: Uint16Array;
}

export function progressTable(timing: Timing): ProgressTable {
  const factors: number[] = [];
  const known = new Map<number, number>();
  const ids = new Uint16Array(timing.factors.length);
  timing.factors.forEach((factor, i) => {
    let id = known.get(factor);
    if (id === undefined) {
      id = factors.length;
      known.set(factor, id);
      factors.push(factor);
    }
    ids[i] = id;
  });
  return { factors, ids };
}

/** What to store for reading `timing` at word `index`, or finished. */
export function readingState(
  timing: Timing,
  table: ProgressTable,
  index: number,
  finished: boolean,
): Reading {
  const count = timing.words.length;
  const at = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const word = timing.words[at];
  const counts = new Array<number>(table.factors.length).fill(0);
  if (!finished) {
    for (let i = at; i < count; i++) counts[table.ids[i]!]!++;
  }
  return {
    position: word ? positionOf(word) : { section: 0, paragraph: 0, word: 0 },
    finished,
    progress: finished ? 1 : count === 0 ? 0 : at / count,
    left: table.factors
      .map((factor, id): [number, number] => [factor, counts[id]!])
      .filter(([, n]) => n > 0),
  };
}

/**
 * Milliseconds left in the book at `wpm`: the same as `timeLeft`'s `book`
 * for the stored word, since each word is rounded as `wordDuration` does.
 */
export function bookTimeLeft(left: Reading["left"], wpm: number): number {
  return left.reduce(
    (ms, [factor, n]) => ms + n * factorDuration(factor, wpm),
    0,
  );
}

/** Progress in whole percent, rounded down, so 100% only once finished. */
export function progressPercent(progress: number): number {
  return Math.floor(progress * 100);
}
