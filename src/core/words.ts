// Words (SPEC.md feature 5): how a run of text becomes the words shown.

import { graphemes, hasLetter } from "./focus.ts";

/**
 * Where a piece is cut after a dash: an em dash, a horizontal bar, a two- or
 * three-em dash, or Gutenberg's `--` (two or more hyphens). A single hyphen
 * (`well-known`) and an en dash (`1914–1918`) don't cut.
 */
const AFTER_DASH = /(?:[—―⸺⸻]|-{2,})(?![—―⸺⸻-])/gu;

/** Opening brackets and quotes, and Spanish ¿ ¡: they join the next word. */
const OPENER = /^[\p{Ps}\p{Pi}¿¡]$/u;

/**
 * True for a line with something on it but no letters, digits or `&`, such
 * as `* * *`: a scene break, which counts as a paragraph end.
 */
export function isSceneBreak(line: string): boolean {
  return line.trim() !== "" && !hasLetter(line) && !line.includes("&");
}

/**
 * Splits one run of text into the words the reader shows, before long words
 * are split.
 *
 * Text between spaces is a word, with its punctuation attached. Words joined
 * by a dash without spaces are split after the dash. A piece with no letters
 * or digits isn't shown on its own: it joins a neighbour, keeping the space
 * between them. Opening marks, and symbols after them, join the word after
 * them; anything else joins the word before it, or the word after it when
 * there's none before. `&` is a word.
 */
export function splitWords(text: string): string[] {
  const words: string[] = [];
  let prefix = "";
  for (const piece of text.split(/\s+/u).flatMap(splitAtDashes)) {
    if (piece === "") continue;
    if (hasLetter(piece) || piece.includes("&")) {
      words.push(prefix + piece);
      prefix = "";
    } else if (words.length === 0 || prefix !== "" || isOpener(piece)) {
      // Waits for the next word. Symbols after an opening mark wait with it,
      // so the text keeps its order.
      prefix += `${piece} `;
    } else {
      words[words.length - 1] += ` ${piece}`;
    }
  }
  if (prefix !== "" && words.length > 0) {
    words[words.length - 1] += ` ${prefix.trimEnd()}`;
  }
  return words;
}

/** Cuts after a dash, where both sides have a letter or digit. */
function splitAtDashes(piece: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (const match of piece.matchAll(AFTER_DASH)) {
    const end = match.index + match[0].length;
    const left = piece.slice(start, end);
    if (hasLetter(left) && hasLetter(piece.slice(end))) {
      parts.push(left);
      start = end;
    }
  }
  parts.push(piece.slice(start));
  return parts;
}

function isOpener(piece: string): boolean {
  return graphemes(piece).every((c) => OPENER.test(c));
}
