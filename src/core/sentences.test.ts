// Sources for the longer samples (authors died over 100 years ago; SPEC.md,
// Legal and licensing): Robert Louis Stevenson (died 1894), The Strange Case
// of Dr Jekyll and Mr Hyde; Victor Hugo (died 1885), Les Misérables; Miguel
// de Cervantes (died 1616), Don Quijote; Leo Tolstoy (died 1910), Anna
// Karenina. The rest are short stock phrases.

import { describe, expect, it } from "vitest";
import { timeWords, wordDuration } from "./durations.ts";
import {
  endsSentence,
  isAbbreviation,
  nextSentenceStart,
  previousSentenceStart,
  punctuation,
  sentenceStart,
  sentenceStarts,
} from "./sentences.ts";
import { splitText, wordText, type Paragraph } from "./text.ts";

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
  });

  it("reads the Greek raised dot as a clause end", () => {
    expect(punctuation("είπε·")).toBe("clause");
  });
});

describe("isAbbreviation", () => {
  it.each([
    "Mr.",
    "Mrs.",
    "Dr.",
    "e.g.",
    "i.e.",
    "U.S.",
    "(e.g.",
    "J.",
    "R.",
    "M.",
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
  ])("%s is an abbreviation", (text) => {
    expect(isAbbreviation(text)).toBe(true);
  });

  it.each(["end.", "I.", "etc.", "usw.", "r.", "г.", "3.14", "1914.", "so..."])(
    "%s isn't",
    (text) => {
      expect(isAbbreviation(text)).toBe(false);
    },
  );
});

describe("sentence pauses", () => {
  it.each([
    [
      "English titles",
      "Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile. He was austere.",
      "Mr. Utterson@260 the lawyer was a man of a rugged countenance@260 that was never lighted by a smile.@600 He was austere.@600",
    ],
    [
      "English e.g., i.e. and U.S.",
      "Fruit, e.g. apples, i.e. food from the U.S. and more. Yes.",
      "Fruit,@400 e.g. apples,@400 i.e. food from the U.S. and more.@600 Yes.@600",
    ],
    [
      "initials",
      "A book by J. R. R. Smith. Read it.",
      "A book by J. R. R. Smith.@600 Read it.@600",
    ],
    [
      "decimals",
      "Pi is about 3.14 and e is 2.72. True.",
      "Pi is about 3.14 and e is 2.72.@600 True.@600",
    ],
    [
      "French",
      "En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. « Entrez ! » dit-il.",
      "En 1815,@400 M. Charles- François-@260 Bienvenu@260 Myriel était évêque de Digne.@600 « Entrez ! »@600 dit-il.@600",
    ],
    [
      "German",
      "Er kam z. B. gestern. „Ja“, sagte er, d. h. Nein. Gut.",
      "Er kam z. B. gestern.@600 „Ja“,@400 sagte er,@400 d. h. Nein.@600 Gut.@600",
    ],
    [
      "Spanish",
      "En un lugar de la Mancha, de cuyo nombre no quiero acordarme. ¿Qué tal, Sra. García? ¡Bien!",
      "En un lugar de la Mancha,@400 de cuyo nombre no quiero acordarme.@780 ¿Qué tal,@400 Sra. García?@600 ¡Bien!@600",
    ],
    [
      "Polish",
      "Kupił np. chleb, tj. bułki. Prof. Nowak wrócił w 1990 r. Potem spał.",
      "Kupił np. chleb,@400 tj. bułki.@600 Prof. Nowak wrócił w 1990 r.@600 Potem spał.@600",
    ],
    [
      "Russian",
      "Все счастливые семьи похожи друг на друга, каждая несчастливая семья несчастлива по-своему. Он пришёл, т. е. вернулся.",
      "Все счастливые@260 семьи похожи друг на друга,@400 каждая несчастливая@260 семья несчастлива@260 по-своему.@780 Он пришёл,@400 т. е. вернулся.@780",
    ],
    [
      "Greek, with `;` as a question mark",
      "Τι κάνεις; Καλά, ευχαριστώ. Ο κ. Παπαδόπουλος ήρθε.",
      "Τι κάνεις;@600 Καλά,@400 ευχαριστώ.@780 Ο κ. Παπαδόπουλος@260 ήρθε.@600",
    ],
  ])("%s", (_, text, expected) => {
    expect(timed(text)).toBe(expected);
  });
});

describe("endsSentence", () => {
  it("ends a sentence at a known abbreviation only as a paragraph's last word", () => {
    const all = words(
      { kind: "prose", text: "He went to the U.S. Then home." },
      { kind: "prose", text: "He lived in the U.S." },
      { kind: "prose", text: "Next." },
    );
    const ends = all.filter(endsSentence).map(wordText);
    expect(ends).toEqual(["home.", "U.S.", "Next."]);
  });

  it("never ends a sentence on a split word's earlier part", () => {
    const all = words({
      kind: "prose",
      text: "See https://example.org/averyveryverylongpage now",
    });
    expect(all.filter((w) => w.continues).some(endsSentence)).toBe(false);
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
});
