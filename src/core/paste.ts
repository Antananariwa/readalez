// Pasted text (SPEC.md feature 1): the paste box's text in, one section out.
// #9 adds the rest of feature 1: hard-wrapped text, Gutenberg's license text
// and the title.

import type { Section } from "./text.ts";

/** A blank line, or a run of them; lines of only spaces and tabs count. */
const BLANK_LINES = /\n[ \t]*(?:\n[ \t]*)*\n/;

/**
 * Splits pasted text into paragraphs at blank lines, as one section. Single
 * line breaks stay in a paragraph's text, where `splitText` reads them as
 * spaces.
 */
export function pastedSections(text: string): Section[] {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(BLANK_LINES)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "")
    .map((paragraph) => ({ kind: "prose" as const, text: paragraph }));
  return [{ paragraphs }];
}
