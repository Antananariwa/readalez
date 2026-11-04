// Pasted text (SPEC.md feature 1): the paste box's text in, a title and one
// section out. Gutenberg's license text is dropped, and hard-wrapped text is
// joined back into its paragraphs.

import { punctuation } from "./sentences.ts";
import type { Section } from "./text.ts";

/** A pasted text as the reader opens it. */
export interface PastedText {
  title: string;
  sections: Section[];
}

/** Titles are cut to this many characters (SPEC.md feature 1). */
export const MAX_TITLE_LENGTH = 60;

/**
 * A blank line, or a run of them. A line of only whitespace counts, such as
 * the non-breaking spaces text copied from web pages can hold.
 */
const BLANK_LINES = /\n[^\S\n]*(?:\n[^\S\n]*)*\n/u;

/**
 * Gutenberg's marker lines, such as `*** START OF THE PROJECT GUTENBERG
 * EBOOK …`. Older files also write `***START OF` or indent the line, as the
 * marker lists of c-w/gutenberg show:
 * https://github.com/c-w/gutenberg/blob/89d79d3dc7d7cc7d9f6ce0b75247513665d44cda/gutenberg/_domain_model/text.py#L7-L88
 */
const START_MARKER = /^[^\S\n]*\*{3}[^\S\n]*START OF\b/u;
const END_MARKER = /^[^\S\n]*\*{3}[^\S\n]*END OF\b/u;

/**
 * A wrapped line counts as full when its length is within this share of the
 * median wrapped line's length.
 */
const SIMILAR_LENGTH = 0.2;

/** Reads pasted text: its title and its paragraphs, as one section. */
export function parsePaste(text: string): PastedText {
  const body = gutenbergBody(normaliseLineBreaks(text));
  return {
    title: titleFrom(body),
    sections: [{ paragraphs: paragraphs(body) }],
  };
}

/** The title `parsePaste` gives, without splitting the paragraphs. */
export function suggestedTitle(text: string): string {
  return titleFrom(gutenbergBody(normaliseLineBreaks(text)));
}

function normaliseLineBreaks(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/**
 * The lines strictly between Gutenberg's `*** START OF` and `*** END OF`
 * lines, or all of the text if it doesn't have both in that order.
 */
export function gutenbergBody(text: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => START_MARKER.test(line));
  if (start === -1) return text;
  const end = lines.findIndex((line, i) => i > start && END_MARKER.test(line));
  if (end === -1) return text;
  return lines.slice(start + 1, end).join("\n");
}

/** The blocks of text between blank lines, each as its trimmed lines. */
function blocks(text: string): string[][] {
  return text
    .split(BLANK_LINES)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    )
    .filter((block) => block.length > 0);
}

/**
 * True when most lines break mid-sentence at similar lengths, as in
 * Gutenberg's plain-text files. Only lines followed by another line of the
 * same block count, since a paragraph's last line is short anyway. A
 * paragraph's last line also fits the wrap width, so text whose last lines
 * mostly run longer (a heading above a paragraph line) isn't hard-wrapped.
 */
export function isHardWrapped(lineBlocks: readonly string[][]): boolean {
  const multiLine = lineBlocks.filter((block) => block.length > 1);
  const wrapped = multiLine.flatMap((block) => block.slice(0, -1));
  if (wrapped.length === 0) return false;
  const lengths = wrapped.map(length).sort((a, b) => a - b);
  const median = lengths[Math.floor(lengths.length / 2)]!;
  const widest = median * (1 + SIMILAR_LENGTH);
  const midSentence = wrapped.filter(
    (line) =>
      Math.abs(length(line) - median) <= median * SIMILAR_LENGTH &&
      punctuation(lastWord(line)) !== "sentence",
  );
  const lastLinesFit = multiLine.filter(
    (block) => length(block.at(-1)!) <= widest,
  );
  return (
    midSentence.length > wrapped.length / 2 &&
    lastLinesFit.length > multiLine.length / 2
  );
}

/**
 * Paragraphs at blank lines. Hard-wrapped text keeps its single line breaks
 * inside a paragraph, where `splitText` reads them as spaces; otherwise each
 * line is its own paragraph.
 */
function paragraphs(text: string): Section["paragraphs"] {
  const lineBlocks = blocks(text);
  const texts = isHardWrapped(lineBlocks)
    ? lineBlocks.map((block) => block.join("\n"))
    : lineBlocks.flat();
  return texts.map((paragraph) => ({
    kind: "prose" as const,
    text: paragraph,
  }));
}

/**
 * The first line, with runs of whitespace as one space, cut at a word
 * boundary to at most 60 characters. A first word longer than that is cut
 * at 60.
 */
export function titleFrom(text: string): string {
  const first = text.split("\n").find((line) => line.trim() !== "") ?? "";
  const chars = [...first.trim().replace(/\s+/gu, " ")];
  if (chars.length <= MAX_TITLE_LENGTH) return chars.join("");
  // One character more, so a space just after the 60th still counts.
  const head = chars.slice(0, MAX_TITLE_LENGTH + 1).join("");
  const space = head.lastIndexOf(" ");
  return space > 0
    ? head.slice(0, space)
    : chars.slice(0, MAX_TITLE_LENGTH).join("");
}

/** Length in characters (code points), as a reader would count them. */
function length(line: string): number {
  return [...line].length;
}

function lastWord(line: string): string {
  return line.split(/\s+/u).at(-1)!;
}
