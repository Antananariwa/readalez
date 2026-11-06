import { describe, expect, it } from "vitest";
import { timeWords, wordDuration } from "./durations.ts";
import { splitText } from "./text.ts";
import {
  formatDuration,
  lookUpTimeLeft,
  timeLeft,
  timeLeftTable,
} from "./timeLeft.ts";

const words = splitText([
  {
    paragraphs: [
      { kind: "heading", text: "Stave I" },
      { kind: "prose", text: "Marley was dead: to begin with." },
    ],
  },
  {
    paragraphs: [
      { kind: "heading", text: "Stave II" },
      {
        kind: "prose",
        text: "When Scrooge awoke, it was extraordinarily dark.",
      },
    ],
  },
]);
const timing = timeWords(words);

/** The sum of the durations of words `from` to `to` (not included). */
function sum(from: number, to: number, wpm: number): number {
  let ms = 0;
  for (let i = from; i < to; i++) ms += wordDuration(timing, i, wpm);
  return ms;
}

describe("timeLeft", () => {
  const chapterEnd = words.findIndex((w) => w.section === 1);

  it("sums the remaining words' durations for the chapter and the book", () => {
    for (const index of [0, 3, chapterEnd - 1, chapterEnd, words.length - 1]) {
      const end = index < chapterEnd ? chapterEnd : words.length;
      expect(timeLeft(timing, index, 300)).toEqual({
        chapter: sum(index, end, 300),
        book: sum(index, words.length, 300),
      });
    }
  });

  it("uses the current speed", () => {
    expect(timeLeft(timing, 0, 600)).toEqual({
      chapter: sum(0, chapterEnd, 600),
      book: sum(0, words.length, 600),
    });
    // At 300 wpm: Stave, I (heading), Marley, was, dead: (1.5×), to, begin,
    // with. (paragraph) = 200 + 1000 + 200 + 200 + 300 + 200 + 200 + 1000.
    expect(timeLeft(timing, 0, 300).chapter).toBe(3300);
  });

  it("is zero past the end", () => {
    expect(timeLeft(timing, words.length, 300)).toEqual({
      chapter: 0,
      book: 0,
    });
  });
});

describe("timeLeftTable", () => {
  it("gives the same time left as timeLeft for every word", () => {
    for (const wpm of [100, 300, 1000]) {
      const table = timeLeftTable(timing, wpm);
      for (let i = 0; i <= words.length; i++) {
        expect(lookUpTimeLeft(table, i)).toEqual(timeLeft(timing, i, wpm));
      }
    }
  });

  it("is zero for a text with no words", () => {
    const empty = timeWords([]);
    expect(lookUpTimeLeft(timeLeftTable(empty, 300), 0)).toEqual({
      chapter: 0,
      book: 0,
    });
  });
});

describe("formatDuration", () => {
  it("shows minutes and seconds, rounded up to the second", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(1)).toBe("0:01");
    expect(formatDuration(1000)).toBe("0:01");
    expect(formatDuration(1001)).toBe("0:02");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(59 * 60_000 + 59_500)).toBe("1:00:00");
  });

  it("shows hours from an hour", () => {
    expect(formatDuration(3_600_000)).toBe("1:00:00");
    expect(formatDuration(2 * 3_600_000 + 5 * 60_000 + 9_000)).toBe("2:05:09");
  });

  it("never goes below zero", () => {
    expect(formatDuration(-500)).toBe("0:00");
  });
});
