import { describe, expect, it } from "vitest";
import { timeWords } from "./durations.ts";
import {
  bookTimeLeft,
  progressPercent,
  progressTable,
  readingState,
} from "./position.ts";
import {
  chapterAt,
  chapterBounds,
  firstWordAt,
  flowIndex,
  flowOrdinal,
  flowProgress,
  flowStart,
  inFlow,
  nextWord,
  partAt,
  readingFlow,
  sentenceStartsAround,
  type Part,
} from "./readingFlow.ts";
import { sentenceStarts } from "./sentences.ts";
import { splitText, wordText, type Section } from "./text.ts";
import { timeLeft } from "./timeLeft.ts";

// A book as #15 sees it: a title page, a preface, a list of illustrations
// between the preface and the first chapter, two chapters in one section,
// and a license at the end.
const sections: Section[] = [
  {
    paragraphs: [
      { kind: "heading", text: "The Title" },
      { kind: "prose", text: "By an author." },
    ],
  },
  {
    paragraphs: [
      { kind: "heading", text: "Preface" },
      { kind: "prose", text: "Read on. It gets better." },
      { kind: "heading", text: "Illustrations" },
      { kind: "prose", text: "A picture, page one." },
      { kind: "heading", text: "Chapter One" },
      { kind: "prose", text: "It began. Then it went on." },
      { kind: "heading", text: "Chapter Two" },
      { kind: "prose", text: "It ended well." },
    ],
  },
  {
    paragraphs: [
      { kind: "heading", text: "License" },
      { kind: "prose", text: "Copy it freely." },
    ],
  },
];
const parts: Part[] = [
  { section: 0, paragraph: 0, skipped: true },
  { section: 1, paragraph: 0, skipped: false },
  { section: 1, paragraph: 2, skipped: true },
  { section: 1, paragraph: 4, skipped: false },
  { section: 2, paragraph: 0, skipped: true },
];
const words = splitText(sections);
const texts = words.map(wordText);
const at = (text: string) => texts.indexOf(text);
const flow = readingFlow(words, parts);
/** The words of the flow, in order. */
const flowWords = words.flatMap((_, i) => (inFlow(flow, i) ? [i] : []));

describe("readingFlow", () => {
  it("finds each part's first word", () => {
    expect(flow.starts.map((i) => texts[i])).toEqual([
      "The",
      "Preface",
      "Illustrations",
      "Chapter",
      "License",
    ]);
    expect(flow.skipped).toEqual([true, false, true, false, true]);
    expect(flow.count).toBe(flowWords.length);
    expect(flowWords.map((i) => texts[i]).join(" ")).toBe(
      "Preface Read on. It gets better. Chapter One It began. Then it went on. Chapter Two It ended well.",
    );
  });

  it("is the whole text with no parts, or none in the flow", () => {
    for (const none of [
      [],
      [{ section: 0, paragraph: 0, skipped: true }],
    ] satisfies Part[][]) {
      const whole = readingFlow(words, none);
      expect(whole.starts).toEqual([0]);
      expect(whole.count).toBe(words.length);
      expect(flowStart(whole)).toBe(0);
    }
  });

  it("drops parts with no words and merges neighbours alike", () => {
    const merged = readingFlow(words, [
      { section: 0, paragraph: 0, skipped: true },
      { section: 0, paragraph: 9, skipped: false },
      { section: 1, paragraph: 0, skipped: true },
      { section: 1, paragraph: 4, skipped: false },
      { section: 1, paragraph: 6, skipped: false },
      { section: 9, paragraph: 0, skipped: true },
    ]);
    expect(merged.starts).toEqual([0, at("Chapter")]);
    expect(merged.skipped).toEqual([true, false]);
  });

  it("starts at the flow's first word", () => {
    expect(texts[flowStart(flow)]).toBe("Preface");
  });

  it("finds a word's part, and the first word at a paragraph", () => {
    expect(partAt(flow, 0)).toBe(0);
    expect(partAt(flow, at("picture,"))).toBe(2);
    expect(partAt(flow, words.length - 1)).toBe(4);
    expect(firstWordAt(words, { section: 1, paragraph: 4 })).toBe(
      at("Chapter"),
    );
    expect(firstWordAt(words, { section: 5, paragraph: 0 })).toBe(words.length);
  });
});

describe("progress over the flow (SPEC.md feature 4)", () => {
  it("is 0% at the flow's first word and before it", () => {
    expect(flowProgress(flow, flowStart(flow))).toBe(0);
    expect(flowProgress(flow, 0)).toBe(0);
    expect(flowProgress(flow, at("author."))).toBe(0);
  });

  it("counts only the flow's words", () => {
    flowWords.forEach((index, ordinal) => {
      expect(flowOrdinal(flow, index)).toBe(ordinal);
      expect(flowIndex(flow, ordinal)).toBe(index);
    });
  });

  it("is 100% after the flow, and the next flow word's in a skipped part between", () => {
    expect(flowProgress(flow, at("License"))).toBe(1);
    expect(flowProgress(flow, words.length - 1)).toBe(1);
    expect(flowOrdinal(flow, at("picture,"))).toBe(
      flowOrdinal(flow, at("Chapter")),
    );
  });

  it("is stored with the position, 100% at the Finished card", () => {
    const timing = timeWords(words);
    const table = progressTable(timing);
    const state = (i: number, finished = false) =>
      readingState(timing, table, i, finished, flow);
    expect(state(flowStart(flow)).progress).toBe(0);
    expect(state(0).progress).toBe(0);
    expect(state(at("License")).progress).toBe(1);
    const last = flowWords.at(-1)!;
    expect(progressPercent(state(last).progress)).toBe(
      Math.floor(((flow.count - 1) / flow.count) * 100),
    );
    expect(state(last, true).progress).toBe(1);
    // Time left counts the flow's words only.
    for (const i of [
      0,
      at("Preface"),
      at("picture,"),
      at("ended"),
      at("License"),
    ]) {
      expect(bookTimeLeft(state(i).left, 300)).toBe(
        timeLeft(timing, i, 300, flow).book,
      );
    }
    expect(bookTimeLeft(state(at("License")).left, 300)).toBe(0);
  });

  it("clamps the progress bar's place to the flow", () => {
    expect(flowIndex(flow, -5)).toBe(flowStart(flow));
    expect(flowIndex(flow, flow.count + 5)).toBe(flowWords.at(-1));
  });
});

describe("nextWord", () => {
  it("goes on word by word inside a part", () => {
    expect(nextWord(flow, at("Read"))).toBe(at("Read") + 1);
  });

  it("jumps over a skipped part inside the flow", () => {
    expect(nextWord(flow, at("better."))).toBe(at("Chapter"));
  });

  it("finishes after the flow's last word", () => {
    expect(nextWord(flow, flowWords.at(-1)!)).toBe("end");
  });

  it("stops at the end of a skipped part, which reads to its end", () => {
    expect(nextWord(flow, at("By"))).toBe(at("an"));
    expect(nextWord(flow, at("author."))).toBe("stop");
    expect(nextWord(flow, at("one."))).toBe("stop");
  });

  it("finishes after the text's last word, even in a skipped part", () => {
    expect(nextWord(flow, words.length - 1)).toBe("end");
  });
});

describe("sentenceStartsAround", () => {
  const starts = sentenceStarts(words);

  it("keeps the flow's sentence starts in the flow, with each part's first word", () => {
    const around = sentenceStartsAround(flow, starts, at("gets"));
    expect(around.map((i) => texts[i])).toEqual([
      "Preface",
      "Read",
      "It",
      "Chapter",
      "It",
      "Then",
      "Chapter",
      "It",
    ]);
  });

  it("keeps a skipped part's own in it", () => {
    const around = sentenceStartsAround(flow, starts, at("page"));
    expect(around).toEqual([at("Illustrations"), at("A")]);
  });
});

describe("chapters (SPEC.md feature 7)", () => {
  const entries = [
    { section: 1, paragraph: 4 },
    { section: 1, paragraph: 6 },
  ];
  const bounds = chapterBounds(words, entries, parts);

  it("start at each entry and each part, and at the text's start", () => {
    expect(bounds.places).toEqual([
      { section: 0, paragraph: 0 },
      { section: 1, paragraph: 0 },
      { section: 1, paragraph: 2 },
      { section: 1, paragraph: 4 },
      { section: 1, paragraph: 6 },
      { section: 2, paragraph: 0 },
    ]);
    expect(bounds.firstWords.map((i) => texts[i])).toEqual([
      "The",
      "Preface",
      "Illustrations",
      "Chapter",
      "Chapter",
      "License",
    ]);
  });

  it("run to the next entry at any depth, within one section or across", () => {
    expect(chapterAt(bounds, at("began."))).toBe(3);
    expect(chapterAt(bounds, at("ended"))).toBe(4);
    expect(chapterAt(bounds, at("freely."))).toBe(5);
  });

  it("let the later of entries at the same word win", () => {
    // Past section 1's last paragraph: its first word is section 2's.
    const same = chapterBounds(words, [
      { section: 1, paragraph: 99 },
      { section: 2, paragraph: 0 },
    ]);
    expect(same.firstWords).toEqual([0, at("License"), at("License")]);
    expect(same.places[chapterAt(same, at("License"))]).toEqual({
      section: 2,
      paragraph: 0,
    });
  });

  it("are one with no chapter list and no parts", () => {
    const one = chapterBounds(words, []);
    expect(one.firstWords).toEqual([0]);
    expect(chapterAt(one, words.length - 1)).toBe(0);
  });

  it("give the time left in the chapter", () => {
    const timing = timeWords(words);
    const from = at("began.");
    const end = texts.indexOf("Chapter", from);
    const whole = timeLeft(timing, from, 300).book;
    const after = timeLeft(timing, end, 300).book;
    expect(timeLeft(timing, from, 300, flow, bounds.firstWords).chapter).toBe(
      whole - after,
    );
  });
});
