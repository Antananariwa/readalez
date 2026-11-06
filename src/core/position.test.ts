import { describe, expect, it } from "vitest";
import { timeWords } from "./durations.ts";
import { storyOfTheDoor } from "./fixtures/storyOfTheDoor.ts";
import {
  bookTimeLeft,
  findPosition,
  positionOf,
  progressPercent,
  progressTable,
  readingState,
  type Position,
} from "./position.ts";
import { splitText, wordText, type Section } from "./text.ts";
import { timeLeft } from "./timeLeft.ts";

const sections: Section[] = [
  {
    paragraphs: [
      { kind: "heading", text: "Stave I" },
      { kind: "prose", text: "Marley was dead—to begin with—and yes—no." },
      { kind: "prose", text: "* * *" },
      { kind: "prose", text: "There is no doubt whatever about that." },
    ],
  },
  {
    paragraphs: [
      { kind: "heading", text: "Stave II" },
      { kind: "prose", text: "When Scrooge awoke, it was dark." },
    ],
  },
];

/**
 * Stands in for older splitting rules: words split at spaces only, so
 * `dead—to` is one word, where `splitText` splits it at the em dash.
 */
function splitAtSpaces(
  input: readonly Section[],
): (Position & { text: string })[] {
  return input.flatMap((section, s) =>
    section.paragraphs.flatMap((paragraph, p) => {
      const text =
        paragraph.kind === "verse" ? paragraph.lines.join(" ") : paragraph.text;
      if (text === "* * *") return [];
      return text
        .split(" ")
        .map((word, w) => ({ section: s, paragraph: p, word: w, text: word }));
    }),
  );
}

describe("findPosition", () => {
  const words = splitText(sections);

  it("finds each word's own position", () => {
    words.forEach((word, i) => {
      expect(findPosition(words, positionOf(word))).toBe(i);
    });
  });

  it("lands in the same paragraph after the splitting rules change", () => {
    const older = splitAtSpaces(sections);
    // Splitting at em dashes gives the paragraph more words than before.
    expect(words.length).toBeGreaterThan(older.length);
    for (const saved of older) {
      const found = words[findPosition(words, saved)]!;
      expect([found.section, found.paragraph]).toEqual([
        saved.section,
        saved.paragraph,
      ]);
    }
    // And the other way: from the newer rules back to the older ones.
    for (const saved of words) {
      const found = older[findPosition(older, positionOf(saved))]!;
      expect([found.section, found.paragraph]).toEqual([
        saved.section,
        saved.paragraph,
      ]);
    }
  });

  it("gives a paragraph's last word for a word index past its end", () => {
    const found = findPosition(words, { section: 0, paragraph: 1, word: 99 });
    expect(wordText(words[found]!)).toBe("no.");
  });

  it("gives the next word for a paragraph that shows no words", () => {
    // Paragraph 2 is the scene break.
    const found = findPosition(words, { section: 0, paragraph: 2, word: 0 });
    expect(wordText(words[found]!)).toBe("There");
  });

  it("gives the last word for a place past the end", () => {
    expect(findPosition(words, { section: 5, paragraph: 0, word: 0 })).toBe(
      words.length - 1,
    );
    expect(findPosition([], { section: 0, paragraph: 0, word: 0 })).toBe(0);
  });
});

describe("readingState", () => {
  const timing = timeWords(splitText([storyOfTheDoor]));
  const table = progressTable(timing);
  const count = timing.words.length;

  it("is at 0% at the first word and 100% at the Finished card", () => {
    expect(readingState(timing, table, 0, false).progress).toBe(0);
    const last = readingState(timing, table, count - 1, false);
    expect(progressPercent(last.progress)).toBe(99);
    const finished = readingState(timing, table, count - 1, true);
    expect(finished.progress).toBe(1);
    expect(progressPercent(finished.progress)).toBe(100);
    expect(finished.finished).toBe(true);
    expect(bookTimeLeft(finished.left, 300)).toBe(0);
  });

  it("stores the word's position", () => {
    const word = timing.words[100]!;
    expect(readingState(timing, table, 100, false).position).toEqual(
      positionOf(word),
    );
  });

  it("gives the same time left as #7's time left from the word", () => {
    for (const wpm of [100, 300, 370, 1000]) {
      for (let i = 0; i < count; i++) {
        const { left } = readingState(timing, table, i, false);
        expect(bookTimeLeft(left, wpm)).toBe(timeLeft(timing, i, wpm).book);
      }
    }
  });
});
