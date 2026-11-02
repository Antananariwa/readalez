import { describe, expect, it } from "vitest";
import { timeWords, wordDuration } from "./durations.ts";
import { splitText } from "./text.ts";
import { timeLeft } from "./timeLeft.ts";

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
    // At 300 wpm: Stave, I (heading), Marley, was, dead: (2×), to, begin,
    // with. (paragraph) = 200 + 800 + 200 + 200 + 400 + 200 + 200 + 800.
    expect(timeLeft(timing, 0, 300).chapter).toBe(3000);
  });

  it("is zero past the end", () => {
    expect(timeLeft(timing, words.length, 300)).toEqual({
      chapter: 0,
      book: 0,
    });
  });
});
