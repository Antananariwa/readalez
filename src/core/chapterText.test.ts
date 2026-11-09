import { describe, expect, it } from "vitest";
import {
  chapterText,
  chapterTexts,
  paragraphText,
  wordAtCharacter,
  wordCount,
  type ParagraphText,
} from "./chapterText.ts";
import { storyOfTheDoor } from "./fixtures/storyOfTheDoor.ts";
import { gutenbergChapter } from "./fixtures/gutenbergChapter.ts";
import { parsePaste } from "./paste.ts";
import { splitText, wordText, type Section, type Word } from "./text.ts";

/** Each word's text in the paragraph, from its place. */
function placed(sections: Section[]): { words: Word[]; found: string[] } {
  const words = splitText(sections);
  const texts = chapterTexts(sections, words);
  const found = words.map((word, i) => {
    const p = texts[word.section]![word.paragraph]!;
    const k = i - p.first;
    return p.text.slice(p.starts[k], p.ends[k]);
  });
  return { words, found };
}

/**
 * True when `found` is the word as written: its text, with runs of spaces
 * for its spaces, less the hyphen added to a split long word's part.
 */
function isWritten(word: Word, found: string): boolean {
  const written = found.replace(/\s+/gu, " ");
  const text = wordText(word);
  return written === text || (word.continues && `${written}-` === text);
}

/** The words that aren't found as written, with what was found. */
function misplaced(sections: Section[]): string[] {
  const { words, found } = placed(sections);
  return words.flatMap((word, i) =>
    isWritten(word, found[i]!) ? [] : [`${wordText(word)} ≠ ${found[i]}`],
  );
}

function prose(...texts: string[]): Section[] {
  return [{ paragraphs: texts.map((text) => ({ kind: "prose", text })) }];
}

describe("chapterTexts", () => {
  it("places every word of a real chapter on its own text", () => {
    expect(placed([storyOfTheDoor]).words.length).toBeGreaterThan(2000);
    expect(misplaced([storyOfTheDoor])).toEqual([]);
  });

  it("places words in a hard-wrapped Gutenberg paste, across line breaks", () => {
    const { sections } = parsePaste(gutenbergChapter);
    expect(paragraphText(sections[0]!.paragraphs[1]!)).toContain("\n");
    expect(placed(sections).words.length).toBeGreaterThan(2000);
    expect(misplaced(sections)).toEqual([]);
  });

  it("places words split at dashes, with no space between them", () => {
    expect(placed(prose("yes—no and yes--no")).found).toEqual([
      "yes—",
      "no",
      "and",
      "yes--",
      "no",
    ]);
  });

  it("places marks joined to a word, with the spaces as written", () => {
    expect(placed(prose("« Bonjour », he  paused  — then")).found).toEqual([
      "« Bonjour »,",
      "he",
      "paused  —",
      "then",
    ]);
    expect(placed(prose("He paused\n— then went.")).found).toEqual([
      "He",
      "paused\n—",
      "then",
      "went.",
    ]);
  });

  it("places the parts of a split long word, without the added hyphen", () => {
    const { words, found } = placed(
      prose(
        "incomprehensibilities a twenty-seven-year-old https://www.gutenberg.org/ebooks/43/pg43-images.html",
      ),
    );
    expect(words.map(wordText)).toEqual([
      "incomprehen-",
      "sibilities",
      "a",
      "twenty-seven-",
      "year-old",
      ...words.slice(5).map(wordText),
    ]);
    expect(words.length).toBeGreaterThan(6);
    expect(found.slice(0, 5)).toEqual([
      "incomprehen",
      "sibilities",
      "a",
      "twenty-seven-",
      "year-old",
    ]);
    expect(found.slice(5).join("")).toBe(
      "https://www.gutenberg.org/ebooks/43/pg43-images.html",
    );
  });

  it("passes over scene breaks, and paragraphs with no words", () => {
    const sections = prose("One two.\n* * *\nThree.", "* * *", "Four.");
    const { found } = placed(sections);
    expect(found).toEqual(["One", "two.", "Three.", "Four."]);
    const texts = chapterTexts(sections, splitText(sections))[0]!;
    expect(texts[1]).toMatchObject({ first: -1, starts: [], ends: [] });
    expect(texts[2]!.first).toBe(3);
  });

  it("keeps sections apart and joins verse lines with line breaks", () => {
    const sections: Section[] = [
      { paragraphs: [{ kind: "heading", text: "Stave I" }] },
      {
        paragraphs: [
          { kind: "heading", text: "Stave II" },
          { kind: "verse", lines: ["How doth the little", "crocodile"] },
        ],
      },
    ];
    const words = splitText(sections);
    const texts = chapterTexts(sections, words);
    expect(texts.map((s) => s.length)).toEqual([1, 2]);
    expect(texts[1]![1]).toMatchObject({
      kind: "verse",
      text: "How doth the little\ncrocodile",
      first: 4,
    });
    expect(misplaced(sections)).toEqual([]);
  });
});

describe("wordAtCharacter", () => {
  const sections = prose("Ab cd, ef.", "Gh");
  const texts = chapterTexts(sections, splitText(sections))[0]!;
  const first: ParagraphText = texts[0]!;

  it("gives the word holding a character, or the next after a space", () => {
    // "Ab cd, ef.": Ab 0–2, cd, 3–6, ef. 7–10.
    expect([0, 1].map((c) => wordAtCharacter(first, c))).toEqual([0, 0]);
    expect([2, 3, 5].map((c) => wordAtCharacter(first, c))).toEqual([1, 1, 1]);
    expect([6, 7, 9].map((c) => wordAtCharacter(first, c))).toEqual([2, 2, 2]);
  });

  it("tells apart words split at a dash", () => {
    const dashed = prose("yes—no");
    const text = chapterTexts(dashed, splitText(dashed))[0]![0]!;
    // "yes—" 0–4, "no" 4–6.
    expect(wordAtCharacter(text, 3)).toBe(0);
    expect(wordAtCharacter(text, 4)).toBe(1);
  });

  it("gives the last word after it, counting from the whole text", () => {
    expect(wordAtCharacter(first, 99)).toBe(2);
    expect(wordAtCharacter(texts[1]!, 0)).toBe(3);
  });

  it("gives null for a paragraph with no words", () => {
    const empty = chapterTexts(prose("* * *"), [])[0]![0]!;
    expect(wordAtCharacter(empty, 0)).toBeNull();
  });
});

describe("wordCount", () => {
  it("counts runs of text between spaces", () => {
    expect(
      wordCount(prose("incomprehensibilities yes—no", "well-\nknown")),
    ).toBe(4);
    expect(wordCount(prose(""))).toBe(0);
    expect(wordCount([])).toBe(0);
  });

  it("counts only the reading flow's paragraphs", () => {
    const sections = [
      ...prose("Title page"),
      ...prose("Once upon a time.", "The end."),
      ...prose("License text here"),
    ];
    expect(
      wordCount(sections, [
        { section: 0, paragraph: 0, skipped: true },
        { section: 1, paragraph: 1, skipped: false },
        { section: 2, paragraph: 0, skipped: true },
      ]),
    ).toBe(2);
  });
});

describe("chapterText", () => {
  const sections: Section[] = [
    {
      paragraphs: [
        { kind: "prose", text: "A." },
        { kind: "prose", text: "B." },
      ],
    },
    {
      paragraphs: [
        { kind: "prose", text: "C." },
        { kind: "prose", text: "D." },
      ],
    },
  ];
  const texts = chapterTexts(sections, splitText(sections));

  it("gives the paragraphs between two places, across sections", () => {
    const chapter = chapterText(
      texts,
      { section: 0, paragraph: 1 },
      { section: 1, paragraph: 1 },
    );
    expect(chapter.paragraphs.map((p) => p.text)).toEqual(["B.", "C."]);
    expect(chapter.places).toEqual([
      { section: 0, paragraph: 1 },
      { section: 1, paragraph: 0 },
    ]);
  });

  it("runs to the text's end with no place after", () => {
    const chapter = chapterText(texts, { section: 1, paragraph: 0 }, undefined);
    expect(chapter.paragraphs.map((p) => p.text)).toEqual(["C.", "D."]);
  });
});
