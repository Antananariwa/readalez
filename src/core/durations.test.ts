// Phrases from Charles Dickens (died 1870), A Christmas Carol, and Charles
// Wesley (died 1788), "Hark! the herald angels sing", put together so that
// each row of SPEC.md feature 6's table appears.

import { describe, expect, it } from "vitest";
import { timeWords, wordDuration } from "./durations.ts";
import { splitText, wordText, type Section } from "./text.ts";
import { DEFAULT_TIMING } from "./timingValues.ts";

const sections: Section[] = [
  {
    paragraphs: [
      { kind: "heading", text: "Stave I" },
      {
        kind: "prose",
        text: "Marley was dead: to begin with. “Bah,” said Scrooge, “Humbug!” Extraordinary circumstances—incomprehensibilities. Old Scrooge",
      },
      {
        kind: "verse",
        lines: ["Hark! the herald angels sing", "Glory to the new-born King;"],
      },
    ],
  },
  {
    paragraphs: [
      { kind: "heading", text: "Stave II" },
      { kind: "prose", text: "The Ghost spoke." },
    ],
  },
];

/** Each word with its duration at 300 wpm (200 ms per ordinary word). */
const expected: [string, number][] = [
  ["Stave", 200],
  ["I", 800], // ends a heading: 4×
  ["Marley", 200],
  ["was", 200],
  ["dead:", 400], // colon: 2×
  ["to", 200],
  ["begin", 200],
  ["with.", 600], // ends a sentence: 3×
  ["“Bah,”", 400], // comma inside a closing quote: 2×
  ["said", 200],
  ["Scrooge,", 400], // 7 letters, not long; comma: 2×
  ["“Humbug!”", 600], // sentence end followed by a closing quote: 3×
  ["Extraordinary", 260], // 13 letters: 1.3×
  ["circumstances—", 520], // long and a dash: 2 × 1.3
  ["incomprehen-", 260], // a split part: long only, the added hyphen isn't a dash
  ["sibilities.", 780], // the last part: long word ending a sentence, 3 × 1.3
  ["Old", 200],
  ["Scrooge", 800], // ends a paragraph: 4×
  ["Hark!", 600], // ends a sentence inside a verse line: 3×
  ["the", 200],
  ["herald", 200],
  ["angels", 200],
  ["sing", 400], // ends a line of verse: 2×
  ["Glory", 200],
  ["to", 200],
  ["the", 200],
  ["new-born", 200], // 7 letters: the hyphen doesn't count
  ["King;", 800], // ends the paragraph right before a heading: 4×
  ["Stave", 200], // a chapter title follows on without stopping
  ["II", 800],
  ["The", 200],
  ["Ghost", 200],
  ["spoke.", 800], // a paragraph end beats a sentence end: 4×
];

describe("wordDuration", () => {
  const words = splitText(sections);
  const timing = timeWords(words);

  it("gives every word of the passage its duration from the table at 300 wpm", () => {
    expect(
      words.map((word, i) => [wordText(word), wordDuration(timing, i, 300)]),
    ).toEqual(expected);
  });

  it("shows the first word after play for the larger of 3× and its usual time", () => {
    const first = (text: string) =>
      wordDuration(
        timing,
        words.findIndex((w) => wordText(w) === text),
        300,
        true,
      );
    expect(first("Marley")).toBe(600);
    expect(first("Extraordinary")).toBe(600);
    expect(first("sibilities.")).toBe(780);
    expect(first("Scrooge")).toBe(800);
  });

  it("scales with the speed: an ordinary word shows for 60,000 ÷ wpm ms", () => {
    const i = words.findIndex((w) => wordText(w) === "Marley");
    expect(wordDuration(timing, i, 100)).toBe(600);
    expect(wordDuration(timing, i, 1000)).toBe(60);
  });

  it("uses the values it is given", () => {
    const tuned = timeWords(words, {
      ...DEFAULT_TIMING,
      longWordLetters: 5,
      sentence: 2.5,
    });
    const i = words.findIndex((w) => wordText(w) === "with.");
    const j = words.findIndex((w) => wordText(w) === "Marley");
    expect(wordDuration(tuned, i, 300)).toBe(500);
    expect(wordDuration(tuned, j, 300)).toBe(260);
  });
});
