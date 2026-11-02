// Long words (SPEC.md feature 5): a word over 13 letters is shown in parts.

import { countLetters, graphemes, isLetter } from "./focus.ts";

/** The most letters shown at once. */
export const MAX_LETTERS = 13;

const HYPHENS = new Set(["-", "‐"]);
const WEB_MARKS = new Set(["/", "."]);
const WEB_ADDRESS = /^[^\p{L}\p{N}]*(?:https?:\/\/|www\.)/iu;

/**
 * Splits a word over 13 letters into parts of at most 13 letters.
 *
 * The word is cut at its own hyphens (or at slashes and dots in a web
 * address), and neighbouring pieces rejoin while they fit, so only as many
 * cuts as needed remain. A piece still over 13 letters is split into the
 * fewest even parts. Every part but the last ends with a hyphen, unless it
 * already ends in one of the cut marks.
 */
export function splitLongWord(word: string): string[] {
  if (countLetters(word) <= MAX_LETTERS) return [word];

  const marks = WEB_ADDRESS.test(word) ? WEB_MARKS : HYPHENS;
  const parts = packPieces(cutAtMarks(word, marks)).flatMap((piece) =>
    countLetters(piece) > MAX_LETTERS ? splitEvenly(piece) : [piece],
  );

  return parts.map((part, i) => {
    if (i === parts.length - 1) return part;
    const last = graphemes(part).at(-1) ?? "";
    return HYPHENS.has(last) || WEB_MARKS.has(last) ? part : `${part}-`;
  });
}

/** Cuts after each run of marks. Pieces without letters merge into a neighbour. */
function cutAtMarks(word: string, marks: Set<string>): string[] {
  const chars = graphemes(word);
  const pieces: string[] = [];
  let current = "";
  chars.forEach((c, i) => {
    current += c;
    const next = chars[i + 1];
    if (marks.has(c) && next !== undefined && !marks.has(next)) {
      pieces.push(current);
      current = "";
    }
  });
  pieces.push(current);

  const merged: string[] = [];
  let carry = "";
  for (const piece of pieces) {
    if (countLetters(piece) === 0) {
      if (merged.length > 0) merged[merged.length - 1] += piece;
      else carry += piece;
    } else {
      merged.push(carry + piece);
      carry = "";
    }
  }
  if (carry !== "") merged.push(carry);
  return merged;
}

/**
 * Joins neighbouring pieces, left to right, while they fit in 13 letters.
 * A piece over 13 letters never joins, since it's split evenly on its own.
 */
function packPieces(pieces: string[]): string[] {
  const packed: string[] = [];
  for (const piece of pieces) {
    const prev = packed.at(-1);
    if (
      prev !== undefined &&
      countLetters(prev) + countLetters(piece) <= MAX_LETTERS
    ) {
      packed[packed.length - 1] = prev + piece;
    } else {
      packed.push(piece);
    }
  }
  return packed;
}

/**
 * Splits a piece into the fewest even parts of at most 13 letters. Earlier
 * parts get the spare letters, and each cut comes right after a letter.
 */
function splitEvenly(piece: string): string[] {
  const chars = graphemes(piece);
  const letters = chars.filter(isLetter).length;
  const count = Math.ceil(letters / MAX_LETTERS);
  const base = Math.floor(letters / count);
  const extra = letters % count;

  const parts: string[] = [];
  let current = "";
  let seen = 0;
  let partIndex = 0;
  let limit = base + (extra > 0 ? 1 : 0);
  for (const c of chars) {
    current += c;
    if (!isLetter(c)) continue;
    seen += 1;
    if (seen === limit && partIndex < count - 1) {
      parts.push(current);
      current = "";
      partIndex += 1;
      limit += base + (partIndex < extra ? 1 : 0);
    }
  }
  parts.push(current);
  return parts;
}
