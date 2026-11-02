// Focus letters (SPEC.md feature 5): which letter of a word is highlighted.

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * Splits text into user-perceived characters, so a letter with accents is one
 * item however it's encoded (`é` or `e` plus U+0301).
 */
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/**
 * Letters and digits count; quotes and other punctuation (« » „ “ ‹ › ¿ ¡
 * included) don't. A grapheme counts when it starts with a letter or digit.
 */
export function isLetter(grapheme: string): boolean {
  return /^[\p{L}\p{N}]/u.test(grapheme);
}

/** True when the text has at least one letter or digit. */
export function hasLetter(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

/** The number of letters and digits in the text. */
export function countLetters(text: string): number {
  return graphemes(text).filter(isLetter).length;
}

/**
 * The 1-based position of the focus letter among a word's letters, by the
 * Spritz-style table. Words over 13 letters are split first (longWords.ts), so
 * the last row is never reached; it's kept to match the convention.
 */
export function focusPosition(letters: number): number {
  if (letters <= 1) return 1;
  if (letters <= 5) return 2;
  if (letters <= 9) return 3;
  if (letters <= 13) return 4;
  return 5;
}

export interface FocusSplit {
  /** The text before the focus letter, leading punctuation included. */
  before: string;
  /** The focus letter, as one grapheme. */
  focus: string;
  /** The rest of the word. */
  after: string;
  /** The number of letters and digits. */
  letters: number;
}

/**
 * Splits a word around its focus letter. A word with no letters focuses its
 * `&`, or else its first character.
 */
export function splitAtFocus(word: string): FocusSplit {
  const chars = graphemes(word);
  const letterIndexes: number[] = [];
  chars.forEach((c, i) => {
    if (isLetter(c)) letterIndexes.push(i);
  });
  const letters = letterIndexes.length;
  const at =
    letters === 0
      ? Math.max(chars.indexOf("&"), 0)
      : (letterIndexes[focusPosition(letters) - 1] ?? 0);
  return {
    before: chars.slice(0, at).join(""),
    focus: chars[at] ?? "",
    after: chars.slice(at + 1).join(""),
    letters,
  };
}
