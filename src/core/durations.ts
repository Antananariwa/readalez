// Word durations (SPEC.md feature 6): how long each word shows.

import { endsSentence, punctuation } from "./sentences.ts";
import { wordText, type Word } from "./text.ts";
import { DEFAULT_TIMING, type TimingValues } from "./timingValues.ts";

/** Words with their timing factors, worked out once per text and values. */
export interface Timing {
  readonly words: readonly Word[];
  readonly values: Readonly<TimingValues>;
  /** One factor per word: its time as a multiple of an ordinary word's. */
  readonly factors: readonly number[];
}

/**
 * A word's factor, given the word after it (for sentence ends after an
 * abbreviation). Of the punctuation rows only the largest applies, and the
 * long-word factor multiplies it. The parts of a split word before the last
 * get no punctuation pause: the hyphen added at a split isn't a dash. The
 * word right before a heading always ends its own paragraph, so it gets the
 * paragraph pause through that rule.
 */
export function wordFactor(
  word: Word,
  next: Word | undefined,
  values: Readonly<TimingValues>,
): number {
  const long = word.letters >= values.longWordLetters ? values.longWord : 1;
  if (word.continues) return long;
  const pauses = [1];
  if (word.end === "paragraph" || word.end === "heading") {
    pauses.push(values.paragraph);
  }
  if (endsSentence(word, next)) pauses.push(values.sentence);
  if (word.end === "line") pauses.push(values.verseLine);
  if (punctuation(wordText(word)) === "clause") pauses.push(values.clause);
  return Math.max(...pauses) * long;
}

/** Works out every word's factor. */
export function timeWords(
  words: readonly Word[],
  values: Readonly<TimingValues> = DEFAULT_TIMING,
): Timing {
  return {
    words,
    values,
    factors: words.map((w, i) => wordFactor(w, words[i + 1], values)),
  };
}

/**
 * How long word `index` shows at `wpm`, in whole milliseconds. An ordinary
 * word shows for 60,000 ÷ wpm. The first word after play or a jump shows for
 * at least the start factor's time.
 */
export function wordDuration(
  timing: Timing,
  index: number,
  wpm: number,
  first = false,
): number {
  const factor = timing.factors[index] ?? 1;
  return factorDuration(
    first ? Math.max(timing.values.start, factor) : factor,
    wpm,
  );
}

/**
 * How long a word with timing factor `factor` shows at `wpm`, in whole
 * milliseconds: `factor` times 60,000 ÷ wpm.
 */
export function factorDuration(factor: number, wpm: number): number {
  return Math.round((60_000 / wpm) * factor);
}
