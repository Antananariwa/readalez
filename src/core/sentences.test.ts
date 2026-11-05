// Sources for the longer samples (authors died over 100 years ago; SPEC.md,
// Legal and licensing): Robert Louis Stevenson (died 1894), The Strange Case
// of Dr Jekyll and Mr Hyde; Victor Hugo (died 1885), Les Misérables; Miguel
// de Cervantes (died 1616), Don Quijote; Leo Tolstoy (died 1910), Anna
// Karenina. The rest are short stock phrases.

import { describe, expect, it } from "vitest";
import { timeWords, wordDuration } from "./durations.ts";
import {
  abbreviation,
  endsSentence,
  nearestSentenceStart,
  nextSentenceStart,
  previousSentenceStart,
  punctuation,
  sentenceStart,
  sentenceStarts,
} from "./sentences.ts";
import { splitText, wordText, type Paragraph, type Word } from "./text.ts";

function words(...paragraphs: Paragraph[]) {
  return splitText([{ paragraphs }]);
}

/**
 * A prose paragraph's words at 300 wpm, with `@ms` after any word that
 * doesn't take the ordinary 200 ms. A word added at the end takes the
 * paragraph pause, so the sample's own last word keeps its sentence pause.
 */
function timed(text: string): string {
  const all = words({ kind: "prose", text: `${text} end` }).slice(0, -1);
  const timing = timeWords(all);
  return all
    .map((word, i) => {
      const ms = wordDuration(timing, i, 300);
      return ms === 200 ? wordText(word) : `${wordText(word)}@${ms}`;
    })
    .join(" ");
}

describe("punctuation", () => {
  it.each([
    ["word", null],
    ["end.", "sentence"],
    ["Stop!", "sentence"],
    ["Why?", "sentence"],
    ["so…", "sentence"],
    ["so...", "sentence"],
    ["“Humbug!”", "sentence"],
    ["(quite.)", "sentence"],
    ["„Ja.“", "sentence"],
    ["« Entrez ! »", "sentence"],
    ["‹oui.›", "sentence"],
    ["first,", "clause"],
    ["“first,”", "clause"],
    ["semi;", "clause"],
    ["colon:", "clause"],
    ["yes—", "clause"],
    ["yes--", "clause"],
    ["paused —", "clause"],
    ["paused –", "clause"],
    ["(aside)", "clause"],
    ["[sic]", "clause"],
    ["twenty-", null],
    ["3.14", null],
    ["¿Qué", null],
  ])("%s is %s", (text, kind) => {
    expect(punctuation(text)).toBe(kind);
  });

  it("reads `;` after a Greek word as a question mark", () => {
    expect(punctuation("κάνεις;")).toBe("sentence");
    expect(punctuation("κάνεις;")).toBe("sentence");
    expect(punctuation("word;")).toBe("clause");
    expect(punctuation("слово;")).toBe("clause");
    expect(punctuation("1821\u037E")).toBe("clause");
  });

  it("reads the Greek raised dot as a clause end", () => {
    expect(punctuation("είπε·")).toBe("clause");
  });
});

describe("abbreviation", () => {
  it.each([
    "Mr.",
    "Mrs.",
    "Dr.",
    "e.g.",
    "i.e.",
    "(e.g.",
    "J.",
    "R.",
    "M.",
    "MM.",
    "z.",
    "B.",
    "np.",
    "Np.",
    "m.in.",
    "т.",
    "е.",
    "т.е.",
    "А.",
    "κ.",
    "π.χ.",
    "Sra.",
  ])("%s never ends a sentence mid-paragraph", (text) => {
    expect(abbreviation(text)).toBe("never");
  });

  it.each([
    "etc.",
    "usw.",
    "itd.",
    "r.",
    "г.",
    "д.",
    "U.S.",
    "a.m.",
    "No.",
    "ok.",
    "Ok.",
    "im.",
    "им.",
  ])("%s ends a sentence before a capital", (text) => {
    expect(abbreviation(text)).toBe("capital");
  });

  it("looks through closing brackets and quotes", () => {
    expect(abbreviation("(U.S.)")).toBe("capital");
    expect(abbreviation("(e.g.)")).toBe("never");
    expect(abbreviation("Mr.”")).toBe("never");
  });

  it.each(["end.", "I.", "Mm.", "OK.", "3.14", "1914.", "so..."])(
    "%s isn't one",
    (text) => {
      expect(abbreviation(text)).toBeNull();
    },
  );
});

describe("sentence pauses", () => {
  it.each([
    [
      "English titles",
      "Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile. He was austere.",
      "Mr. Utterson@260 the lawyer was a man of a rugged countenance@260 that was never lighted by a smile.@400 He was austere.@400",
    ],
    [
      "English e.g., i.e. and U.S.",
      "Fruit, e.g. apples, i.e. food from the U.S. and more. Yes.",
      "Fruit,@300 e.g. apples,@300 i.e. food from the U.S. and more.@400 Yes.@400",
    ],
    [
      "initials",
      "A book by J. R. R. Smith. Read it.",
      "A book by J. R. R. Smith.@400 Read it.@400",
    ],
    [
      "decimals",
      "Pi is about 3.14 and e is 2.72. True.",
      "Pi is about 3.14 and e is 2.72.@400 True.@400",
    ],
    [
      "French",
      "En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. « Entrez ! » dit-il.",
      "En 1815,@300 M. Charles- François-@260 Bienvenu@260 Myriel était évêque de Digne.@400 « Entrez ! »@400 dit-il.@400",
    ],
    [
      "German",
      "Er kam z. B. gestern. „Ja“, sagte er, d. h. Nein. Gut.",
      "Er kam z. B. gestern.@400 „Ja“,@300 sagte er,@300 d. h. Nein.@400 Gut.@400",
    ],
    [
      "Spanish",
      "En un lugar de la Mancha, de cuyo nombre no quiero acordarme. ¿Qué tal, Sra. García? ¡Bien!",
      "En un lugar de la Mancha,@300 de cuyo nombre no quiero acordarme.@520 ¿Qué tal,@300 Sra. García?@400 ¡Bien!@400",
    ],
    [
      "Polish",
      "Kupił np. chleb, tj. bułki. Prof. Nowak wrócił w 1990 r. Potem spał.",
      "Kupił np. chleb,@300 tj. bułki.@400 Prof. Nowak wrócił w 1990 r.@400 Potem spał.@400",
    ],
    [
      "Russian",
      "Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. Он пришёл, т. е. вернулся.",
      "Все счастливые@260 семьи похожи друг на друга,@300 каждая несчастливая@260 семья несчастлива@260 по-своему.@520 Он пришёл,@300 т. е. вернулся.@520",
    ],
    [
      "Greek, with `;` as a question mark",
      "Τι κάνεις; Καλά, ευχαριστώ. Ο κ. Παπαδόπουλος ήρθε.",
      "Τι κάνεις;@400 Καλά,@300 ευχαριστώ.@520 Ο κ. Παπαδόπουλος@260 ήρθε.@400",
    ],
  ])("%s", (_, text, expected) => {
    expect(timed(text)).toBe(expected);
  });
});

describe("endsSentence", () => {
  /** The words that end a sentence. */
  function ends(all: Word[]): string[] {
    return all.filter((w, i) => endsSentence(w, all[i + 1])).map(wordText);
  }

  it("ends a sentence at a title or initial only as a paragraph's last word", () => {
    const all = words(
      { kind: "prose", text: "I met Mr. Hyde and J. R. R. Smith there." },
      { kind: "prose", text: "So did Dr." },
      { kind: "prose", text: "Next." },
    );
    expect(ends(all)).toEqual(["there.", "Dr.", "Next."]);
  });

  it("ends a sentence at other abbreviations when the next word starts with a capital", () => {
    const all = words(
      { kind: "prose", text: "He went to the U.S. Then home." },
      { kind: "prose", text: "Pears, etc. and apples, etc. “Then” we ate." },
      { kind: "prose", text: "W 1990 r. ojciec wrócił w 1991 r. Potem spał." },
      { kind: "prose", text: "He lives at No. 5 and said no. He left." },
      { kind: "prose", text: "Kupił ok. 5 kg. Było ok. Dobrze." },
    );
    expect(ends(all)).toEqual([
      "U.S.",
      "home.",
      "etc.",
      "ate.",
      "r.",
      "spał.",
      "no.",
      "left.",
      "kg.",
      "ok.",
      "Dobrze.",
    ]);
  });

  it("ends a sentence at a known abbreviation as a paragraph's last word", () => {
    const all = words(
      { kind: "prose", text: "He lived in the U.S." },
      { kind: "prose", text: "Next." },
    );
    expect(ends(all)).toEqual(["U.S.", "Next."]);
  });

  it("doesn't end a sentence at an abbreviation in brackets", () => {
    const all = words({
      kind: "prose",
      text: "Sales in the (U.S.) rose. Then fell.",
    });
    expect(ends(all)).toEqual(["rose.", "fell."]);
  });

  it("ends a sentence at common words that look like abbreviations", () => {
    const all = words(
      { kind: "prose", text: "Я сказал им. Они ушли." },
      { kind: "prose", text: "Dałem im. Potem spał." },
      { kind: "prose", text: "That is ok. Fine then." },
      { kind: "prose", text: "Mm. Fine then." },
    );
    expect(ends(all)).toEqual([
      "им.",
      "ушли.",
      "im.",
      "spał.",
      "ok.",
      "then.",
      "Mm.",
      "then.",
    ]);
  });

  it("never ends a sentence on a split word's earlier part", () => {
    const all = words({
      kind: "prose",
      text: "See https://example.org/averyveryverylongpage now",
    });
    expect(all.some((w, i) => w.continues && endsSentence(w, all[i + 1]))).toBe(
      false,
    );
  });
});

describe("sentence starts", () => {
  const all = words(
    { kind: "heading", text: "Story of the Door" },
    {
      kind: "prose",
      text: "Mr. Utterson the lawyer was a man. He was cold. Yet lovable.",
    },
  );
  const starts = sentenceStarts(all);
  const at = (text: string) => all.findIndex((w) => wordText(w) === text);

  it("starts a sentence after each sentence end, not after Mr.", () => {
    expect(starts.map((i) => wordText(all[i]!))).toEqual([
      "Story",
      "Mr.",
      "He",
      "Yet",
    ]);
  });

  it("gives a word's sentence start and the previous and next ones", () => {
    const i = at("Utterson");
    expect(sentenceStart(starts, i)).toBe(at("Mr."));
    expect(previousSentenceStart(starts, i)).toBe(at("Story"));
    expect(nextSentenceStart(starts, i)).toBe(at("He"));
    expect(sentenceStart(starts, at("He"))).toBe(at("He"));
  });

  it("has no previous start in the first sentence or next in the last", () => {
    expect(previousSentenceStart(starts, at("Door"))).toBeNull();
    expect(nextSentenceStart(starts, at("lovable."))).toBeNull();
    expect(sentenceStarts([])).toEqual([]);
  });

  it("finds the nearest sentence start, the earlier one on a tie", () => {
    // Starts: Story (0), Mr. (4), He (11), Yet (14).
    expect(nearestSentenceStart(starts, at("lawyer"))).toBe(at("Mr."));
    expect(nearestSentenceStart(starts, at("lawyer") + 1)).toBe(at("He"));
    expect(nearestSentenceStart(starts, at("Mr."))).toBe(at("Mr."));
    // "the" (2) is two words from Story and from Mr.
    expect(nearestSentenceStart(starts, 2)).toBe(at("Story"));
    expect(nearestSentenceStart(starts, at("lovable."))).toBe(at("Yet"));
    expect(nearestSentenceStart(starts, all.length + 5)).toBe(at("Yet"));
    expect(nearestSentenceStart([], 3)).toBe(0);
  });
});
