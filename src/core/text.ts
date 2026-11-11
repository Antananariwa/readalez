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
  /**
   * True for every part of a split long word except the last, so the part
   * is timed without punctuation pauses (SPEC.md feature 6).
   */
  continues: boolean;
}

/** The word as shown, punctuation included. */
export function wordText(word: Word): string {
  return word.before + word.focus + word.after;
}

/** Splits sections and paragraphs into the words the reader shows, in order. */
export function splitText(sections: readonly Section[]): Word[] {
  const steps = splitTextInSteps(sections);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

/** How far `splitTextInSteps` has got, in paragraphs. */
export interface SplitProgress {
  done: number;
  total: number;
}

/**
 * `splitText` in steps of `paragraphsPerStep` paragraphs, so a caller can
 * show progress between them (SPEC.md feature 2). Yields after each step
 * but the last, and returns the words. With 100 paragraphs, Moby Dick's
 * fixture took 28 steps of 64 ms (median) and at most 102 ms each, in Node
 * in the dev container (#16).
 */
export function* splitTextInSteps(
  sections: readonly Section[],
  paragraphsPerStep = 100,
): Generator<SplitProgress, Word[], void> {
  const total = sections.reduce((sum, s) => sum + s.paragraphs.length, 0);
  const words: Word[] = [];
  let done = 0;
  for (const [s, section] of sections.entries()) {
    for (const [p, paragraph] of section.paragraphs.entries()) {
      paragraphWords(paragraph).forEach(({ text, end, continues }, w) => {
        words.push({
          section: s,
          paragraph: p,
          word: w,
          ...splitAtFocus(text),
          end,
          continues,
        });
      });
      done++;
      if (done % paragraphsPerStep === 0 && done < total) {
        yield { done, total };
      }
    }
  }
  return words;
}

interface Shown {
  text: string;
  end: WordEnd | null;
  continues: boolean;
}

function paragraphWords(paragraph: Paragraph): Shown[] {
  const shown: Shown[] = [];

  // Splits a run of text into shown words and marks the last one.
  const addUnit = (text: string, end: WordEnd | null) => {
    const parts = splitWords(text).flatMap((word) =>
      splitLongWord(word).map((part, i, all) => ({
        text: part,
        end: null,
        continues: i < all.length - 1,
      })),
    );
    shown.push(...parts);
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
