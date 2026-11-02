// Timing values and speed (SPEC.md feature 6). The tuning screen (#19)
// changes the values on a device; a PR that changes a default also updates
// the table in SPEC.md feature 6 (feature 11).

/** How long a word shows, as multiples of an ordinary word's time. */
export interface TimingValues {
  /** A word with at least this many letters and digits is long. */
  longWordLetters: number;
  /** A long word; multiplies the punctuation factor. */
  longWord: number;
  /** A word ending with `,` `;` `:` a dash or a closing bracket. */
  clause: number;
  /** A word ending a line of verse. */
  verseLine: number;
  /** A word ending a sentence. */
  sentence: number;
  /** A word ending a paragraph or a heading, or right before a heading. */
  paragraph: number;
  /** The least for the first word after play or a jump. */
  start: number;
}

/** The starting values from SPEC.md feature 6's table. */
export const DEFAULT_TIMING: Readonly<TimingValues> = Object.freeze({
  longWordLetters: 8,
  longWord: 1.3,
  clause: 2,
  verseLine: 2,
  sentence: 3,
  paragraph: 4,
  start: 3,
});

export const MIN_WPM = 100;
export const MAX_WPM = 1000;
export const WPM_STEP = 10;
export const DEFAULT_WPM = 300;

/** The nearest allowed speed: 100–1,000 words per minute in steps of 10. */
export function clampSpeed(wpm: number): number {
  if (!Number.isFinite(wpm)) return DEFAULT_WPM;
  const stepped = Math.round(wpm / WPM_STEP) * WPM_STEP;
  return Math.min(MAX_WPM, Math.max(MIN_WPM, stepped));
}

/** One step slower (-1) or faster (+1), within the allowed range. */
export function stepSpeed(wpm: number, steps: number): number {
  return clampSpeed(clampSpeed(wpm) + steps * WPM_STEP);
}
