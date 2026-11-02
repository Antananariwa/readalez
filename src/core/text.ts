// The text model (SPEC.md feature 5): sections and paragraphs in, words out.

import { splitAtFocus } from "./focus.ts";
import { splitLongWord } from "./longWords.ts";
import { isSceneBreak, splitWords } from "./words.ts";

/**
 * A paragraph of an imported text. Pasted text (#9) and EPUB import (#14)
 * produce these. In prose, single line breaks read as spaces, and a line of
 * only symbols (`* * *`) is a scene break.
 */
export type Paragraph =
  | { kind: "prose"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "verse"; lines: readonly string[] };

/** A chapter or other part of a text. */
export interface Section {
  paragraphs: readonly Paragraph[];
}

/**
 * What a shown word ends: a paragraph (scene breaks included), a heading or a
 * line of verse. The last word of a verse paragraph ends the paragraph.
 */
export type WordEnd = "paragraph" | "heading" | "line";

/** One word as the reader shows it; a long word's parts are one each. */
export interface Word {
  /** Index of the input section. */
  section: number;
  /**
   * Index of the input paragraph within its section. It counts paragraphs
   * that show no words too, so it stays stable when splitting rules change.
   */
  paragraph: number;
  /** Index of the shown word within its paragraph. */
  word: number;
  /** The text before the focus letter. */
  before: string;
  /** The focus letter. */
  focus: string;
  /** The text after the focus letter. */
  after: string;
  /** Letters and digits in the word. */
  letters: number;
  end: WordEnd | null;
}

/** Splits sections and paragraphs into the words the reader shows, in order. */
export function splitText(sections: readonly Section[]): Word[] {
  const words: Word[] = [];
  sections.forEach((section, s) => {
    section.paragraphs.forEach((paragraph, p) => {
      paragraphWords(paragraph).forEach(({ text, end }, w) => {
        words.push({
          section: s,
          paragraph: p,
          word: w,
          ...splitAtFocus(text),
          end,
        });
      });
    });
  });
  return words;
}

interface Shown {
  text: string;
  end: WordEnd | null;
}

function paragraphWords(paragraph: Paragraph): Shown[] {
  const shown: Shown[] = [];

  // Splits a run of text into shown words and marks the last one.
  const addUnit = (text: string, end: WordEnd | null) => {
    const parts = splitWords(text).flatMap(splitLongWord);
    for (const part of parts) shown.push({ text: part, end: null });
    const last = shown.at(-1);
    if (last && parts.length > 0 && end) last.end = end;
  };

  // A scene break ends the paragraph at the word before it.
  const sceneBreak = () => {
    const last = shown.at(-1);
    if (last) last.end = "paragraph";
  };

  if (paragraph.kind === "verse") {
    for (const line of paragraph.lines) {
      if (isSceneBreak(line)) sceneBreak();
      else addUnit(line, "line");
    }
    const last = shown.at(-1);
    if (last) last.end = "paragraph";
    return shown;
  }

  // Prose and headings: lines join with spaces, split at scene breaks.
  let run: string[] = [];
  const flush = () => {
    addUnit(run.join(" "), null);
    run = [];
  };
  for (const line of paragraph.text.split("\n")) {
    if (isSceneBreak(line)) {
      flush();
      sceneBreak();
    } else {
      run.push(line);
    }
  }
  flush();
  const last = shown.at(-1);
  if (last) last.end = paragraph.kind === "heading" ? "heading" : "paragraph";
  return shown;
}
