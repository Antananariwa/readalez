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
  ["I", 1000], // ends a heading: 5×
  ["Marley", 200],
  ["was", 200],
  ["dead:", 300], // colon: 1.5×
  ["to", 200],
  ["begin", 200],
  ["with.", 400], // ends a sentence: 2×
  ["“Bah,”", 300], // comma inside a closing quote: 1.5×
  ["said", 200],
  ["Scrooge,", 300], // 7 letters, not long; comma: 1.5×
  ["“Humbug!”", 400], // sentence end followed by a closing quote: 2×
  ["Extraordinary", 260], // 13 letters: 1.3×
  ["circumstances—", 390], // long and a dash: 1.5 × 1.3
  ["incomprehen-", 260], // a split part: long only, the added hyphen isn't a dash
  ["sibilities.", 520], // the last part: long word ending a sentence, 2 × 1.3
  ["Old", 200],
  ["Scrooge", 1000], // ends a paragraph: 5×
  ["Hark!", 400], // ends a sentence inside a verse line: 2×
  ["the", 200],
  ["herald", 200],
  ["angels", 200],
  ["sing", 400], // ends a line of verse: 2×
  ["Glory", 200],
  ["to", 200],
  ["the", 200],
  ["new-born", 200], // 7 letters: the hyphen doesn't count
  ["King;", 1000], // ends the paragraph right before a heading: 5×
  ["Stave", 200], // a chapter title follows on without stopping
  ["II", 1000],
  ["The", 200],
  ["Ghost", 200],
  ["spoke.", 1000], // a paragraph end beats a sentence end: 5×
];

describe("wordDuration", () => {
  const words = splitText(sections);
  const timing = timeWords(words);

  it("gives every word of the passage its duration from the table at 300 wpm", () => {
    expect(
      words.map((word, i) => [wordText(word), wordDuration(timing, i, 300)]),
    ).toEqual(expected);
  });

  it("shows the first word after play for the larger of 1.5× and its usual time", () => {
    const first = (text: string) =>
      wordDuration(
        timing,
        words.findIndex((w) => wordText(w) === text),
        300,
        true,
      );
    expect(first("Marley")).toBe(300);
    expect(first("Extraordinary")).toBe(300);
    expect(first("sibilities.")).toBe(520);
    expect(first("Scrooge")).toBe(1000);
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
