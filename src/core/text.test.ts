import { describe, expect, it } from "vitest";
import { splitText, splitTextInSteps, type Word } from "./text.ts";

/** A word's text with its end mark, if any: `alone.|paragraph`. */
function label(word: Word): string {
  const text = word.before + word.focus + word.after;
  return word.end ? `${text}|${word.end}` : text;
}

describe("splitText", () => {
  it("gives every word its section, paragraph and word index", () => {
    const words = splitText([
      {
        paragraphs: [
          { kind: "heading", text: "Stave I" },
          { kind: "prose", text: "Marley was dead." },
        ],
      },
      {
        paragraphs: [
          { kind: "prose", text: "* * *" },
          { kind: "prose", text: "Old Fezziwig." },
        ],
      },
    ]);
    expect(
      words.map((w) => [w.section, w.paragraph, w.word, label(w)]),
    ).toEqual([
      [0, 0, 0, "Stave"],
      [0, 0, 1, "I|heading"],
      [0, 1, 0, "Marley"],
      [0, 1, 1, "was"],
      [0, 1, 2, "dead.|paragraph"],
      [1, 1, 0, "Old"],
      [1, 1, 1, "Fezziwig.|paragraph"],
    ]);
  });

  it("marks every part of a split word but the last as continuing", () => {
    const words = splitText([
      {
        paragraphs: [{ kind: "prose", text: "an incomprehensibilities, yes" }],
      },
    ]);
    expect(words.map((w) => [label(w), w.continues])).toEqual([
      ["an", false],
      ["incomprehen-", true],
      ["sibilities,", false],
      ["yes|paragraph", false],
    ]);
  });

  it("indexes each part of a long word, and marks only the last part", () => {
    const words = splitText([
      { paragraphs: [{ kind: "prose", text: "the establishments" }] },
    ]);
    expect(words.map((w) => [w.word, label(w), w.letters])).toEqual([
      [0, "the", 3],
      [1, "establi-", 7],
      [2, "shments|paragraph", 7],
    ]);
  });

  it("marks verse line ends, with the paragraph end on the last line", () => {
    const words = splitText([
      {
        paragraphs: [
          {
            kind: "verse",
            lines: [
              "How doth the little crocodile",
              "Improve his shining tail",
            ],
          },
        ],
      },
    ]);
    expect(words.map(label)).toEqual([
      "How",
      "doth",
      "the",
      "little",
      "crocodile|line",
      "Improve",
      "his",
      "shining",
      "tail|paragraph",
    ]);
  });

  it("reads single line breaks in prose as spaces", () => {
    const words = splitText([
      { paragraphs: [{ kind: "prose", text: "He paused\n— then left." }] },
    ]);
    expect(words.map(label)).toEqual([
      "He",
      "paused —",
      "then",
      "left.|paragraph",
    ]);
  });

  it("hides a scene break and ends the paragraph at the word before it", () => {
    const words = splitText([
      {
        paragraphs: [
          { kind: "prose", text: "He left.\n* * *\nShe came." },
          {
            kind: "verse",
            lines: ["One line", "* * *", "Another line"],
          },
        ],
      },
    ]);
    expect(words.map(label)).toEqual([
      "He",
      "left.|paragraph",
      "She",
      "came.|paragraph",
      "One",
      "line|paragraph",
      "Another",
      "line|paragraph",
    ]);
    expect(words.map((w) => w.word)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
  });

  it("shows nothing for empty input", () => {
    expect(splitText([])).toEqual([]);
    expect(splitText([{ paragraphs: [{ kind: "prose", text: "" }] }])).toEqual(
      [],
    );
  });
});

describe("splitTextInSteps", () => {
  const sections = [
    {
      paragraphs: [
        { kind: "prose" as const, text: "One two." },
        { kind: "prose" as const, text: "Three." },
      ],
    },
    { paragraphs: [] },
    {
      paragraphs: [
        { kind: "prose" as const, text: "Four, five." },
        { kind: "verse" as const, lines: ["Six", "seven"] },
        { kind: "prose" as const, text: "Eight." },
      ],
    },
  ];

  it("yields the paragraphs done so far, then returns splitText's words", () => {
    const steps = splitTextInSteps(sections, 2);
    const progress = [];
    let step = steps.next();
    while (!step.done) {
      progress.push(step.value);
      step = steps.next();
    }
    expect(progress).toEqual([
      { done: 2, total: 5 },
      { done: 4, total: 5 },
    ]);
    expect(step.value).toEqual(splitText(sections));
  });
});
