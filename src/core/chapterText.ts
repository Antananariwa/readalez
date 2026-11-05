// The text of the paused view (SPEC.md feature 7): each paragraph as written,
// with where each shown word sits in it, so the view can mark the current
// word and turn a tap on the text into a word.

import { isSceneBreak } from "./words.ts";
import { wordText, type Paragraph, type Section, type Word } from "./text.ts";

/** One paragraph as the paused view shows it. */
export interface ParagraphText {
  kind: Paragraph["kind"];
  /** The paragraph as written; line breaks read as spaces, except in verse. */
  text: string;
  /** The index of its first word in the whole text, or -1 if it has none. */
  first: number;
  /** Where each of its words starts in `text`, in order. */
  starts: number[];
  /** Where each of its words ends in `text` (not included). */
  ends: number[];
}

/** A paragraph's text as written: verse lines are joined with line breaks. */
export function paragraphText(paragraph: Paragraph): string {
  return paragraph.kind === "verse"
    ? paragraph.lines.join("\n")
    : paragraph.text;
}

/**
 * Every paragraph of every section, with its words' places in its text, as
 * `[section][paragraph]`. `words` are `splitText(sections)`.
 */
export function chapterTexts(
  sections: readonly Section[],
  words: readonly Word[],
): ParagraphText[][] {
  const texts = sections.map((section) =>
    section.paragraphs.map((paragraph): ParagraphText => ({
      kind: paragraph.kind,
      text: paragraphText(paragraph),
      first: -1,
      starts: [],
      ends: [],
    })),
  );
  let i = 0;
  while (i < words.length) {
    const { section, paragraph } = words[i]!;
    const target = texts[section]?.[paragraph];
    let end = i;
    while (
      end < words.length &&
      words[end]!.section === section &&
      words[end]!.paragraph === paragraph
    ) {
      end++;
    }
    if (target) place(target, words, i, end);
    i = end;
  }
  return texts;
}

const SPACE = /\s/u;

/**
 * Finds words `from`…`to` in the paragraph's text, in order. A word is its
 * text's characters with runs of spaces read as one space
 * (`splitText` joins a lone dash to its word with one space), plus, on a
 * split long word's part, a hyphen that may have been added. Lines of only
 * symbols (scene breaks) show no words and are passed over.
 */
function place(
  target: ParagraphText,
  words: readonly Word[],
  from: number,
  to: number,
): void {
  const text = target.text;
  let at = 0;

  const skipSpaces = () => {
    while (at < text.length && SPACE.test(text[at]!)) at++;
  };
  // Spaces, and scene-break lines, between words.
  const skipGap = () => {
    for (;;) {
      skipSpaces();
      const lineStart = at === 0 || text[at - 1] === "\n";
      if (!lineStart || at >= text.length) return;
      const lineEnd = text.indexOf("\n", at);
      const line = text.slice(at, lineEnd === -1 ? text.length : lineEnd);
      if (!isSceneBreak(line)) return;
      at += line.length;
    }
  };

  target.first = from;
  for (let w = from; w < to; w++) {
    const word = words[w]!;
    const shown = wordText(word);
    skipGap();
    const start = at;
    for (let c = 0; c < shown.length; c++) {
      const char = shown[c]!;
      if (char === " " && SPACE.test(text[at] ?? "")) {
        skipSpaces();
      } else if (text[at] === char) {
        at++;
      } else if (char === "-" && word.continues && c === shown.length - 1) {
        // The hyphen added where a long word is split.
      } else {
        throw new Error(
          `Word ${w} ("${shown}") isn't in its paragraph's text at ${at}.`,
        );
      }
    }
    target.starts.push(start);
    target.ends.push(at);
  }
}

/**
 * The word at character `char` of the paragraph's text, such as the one a tap
 * landed on: the word holding it, or the next word when it's a space between
 * words. After the last word it's the last word; a paragraph with no words
 * gives null.
 */
export function wordAtCharacter(
  paragraph: ParagraphText,
  char: number,
): number | null {
  const { ends, first } = paragraph;
  if (ends.length === 0) return null;
  let low = 0;
  let high = ends.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((ends[mid] ?? 0) > char) high = mid;
    else low = mid + 1;
  }
  return first + low;
}

/** The text's word count, for the Finished card: runs of text between spaces. */
export function wordCount(sections: readonly Section[]): number {
  let count = 0;
  for (const section of sections) {
    for (const paragraph of section.paragraphs) {
      count += paragraphText(paragraph).match(/\S+/gu)?.length ?? 0;
    }
  }
  return count;
}
