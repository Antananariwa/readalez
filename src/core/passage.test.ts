// End-to-end check of the reading core for issue #6: real public-domain text
// goes in as sections and paragraphs, and every shown word and focus letter
// is compared with a hand-checked list.
//
// Sources (authors died over 100 years ago; SPEC.md, Legal and licensing),
// from the Standard Ebooks editions (CC0 markup, public-domain text):
// - Charles Dickens (died 1870), A Christmas Carol, Stave I.
// - Robert Louis Stevenson (died 1894), The Strange Case of Dr Jekyll and
//   Mr Hyde, chapters 1 and 6.

import { describe, expect, it } from "vitest";
import { splitText, type Section, type Word } from "./text.ts";

const sections: Section[] = [
  {
    paragraphs: [
      { kind: "heading", text: "Stave I" },
      {
        kind: "prose",
        text: "“I wish to be left alone,” said Scrooge. “Since you ask me what I wish, gentlemen, that is my answer. I don’t make merry myself at Christmas, and I can’t afford to make idle people merry. I help to support the establishments I have mentioned—they cost enough: and those who are badly off must go there.”",
      },
      {
        kind: "prose",
        text: "“If they would rather die,” said Scrooge, “they had better do it, and decrease the surplus population. Besides—excuse me—I don’t know that.”",
      },
    ],
  },
  {
    paragraphs: [
      {
        kind: "prose",
        text: "“My dear sir …” began Enfield, surprised out of himself.",
      },
      {
        kind: "prose",
        text: "On the 12th, and again on the 14th, the door was shut against the lawyer.",
      },
    ],
  },
];

/** Hand-checked words per section and paragraph, focus letter in brackets. */
const expected: string[][][] = [
  [
    ["S[t]ave", "[I]"],
    [
      "“[I]",
      "w[i]sh",
      "t[o]",
      "b[e]",
      "l[e]ft",
      "a[l]one,”",
      "s[a]id",
      "Sc[r]ooge.",
      "“S[i]nce",
      "y[o]u",
      "a[s]k",
      "m[e]",
      "w[h]at",
      "[I]",
      "w[i]sh,",
      "ge[n]tlemen,",
      "t[h]at",
      "i[s]",
      "m[y]",
      "an[s]wer.",
      "[I]",
      "d[o]n’t",
      "m[a]ke",
      "m[e]rry",
      "my[s]elf",
      "a[t]",
      "Ch[r]istmas,",
      "a[n]d",
      "[I]",
      "c[a]n’t",
      "af[f]ord",
      "t[o]",
      "m[a]ke",
      "i[d]le",
      "pe[o]ple",
      "m[e]rry.",
      "[I]",
      "h[e]lp",
      "t[o]",
      "su[p]port",
      "t[h]e",
      "es[t]abli-",
      "sh[m]ents",
      "[I]",
      "h[a]ve",
      "me[n]tioned—",
      "t[h]ey",
      "c[o]st",
      "en[o]ugh:",
      "a[n]d",
      "t[h]ose",
      "w[h]o",
      "a[r]e",
      "b[a]dly",
      "o[f]f",
      "m[u]st",
      "g[o]",
      "t[h]ere.”",
    ],
    [
      "“I[f]",
      "t[h]ey",
      "w[o]uld",
      "ra[t]her",
      "d[i]e,”",
      "s[a]id",
      "Sc[r]ooge,",
      "“t[h]ey",
      "h[a]d",
      "be[t]ter",
      "d[o]",
      "i[t],",
      "a[n]d",
      "de[c]rease",
      "t[h]e",
      "su[r]plus",
      "pop[u]lation.",
      "Be[s]ides—",
      "ex[c]use",
      "m[e]—",
      "[I]",
      "d[o]n’t",
      "k[n]ow",
      "t[h]at.”",
    ],
  ],
  [
    [
      "“M[y]",
      "d[e]ar",
      "s[i]r …”",
      "b[e]gan",
      "En[f]ield,",
      "su[r]prised",
      "o[u]t",
      "o[f]",
      "hi[m]self.",
    ],
    [
      "O[n]",
      "t[h]e",
      "1[2]th,",
      "a[n]d",
      "a[g]ain",
      "o[n]",
      "t[h]e",
      "1[4]th,",
      "t[h]e",
      "d[o]or",
      "w[a]s",
      "s[h]ut",
      "ag[a]inst",
      "t[h]e",
      "la[w]yer.",
    ],
  ],
];

function show(word: Word): string {
  return `${word.before}[${word.focus}]${word.after}`;
}

describe("a public-domain passage through the reading core", () => {
  const words = splitText(sections);

  it("has about 100 words", () => {
    expect(words.length).toBeGreaterThanOrEqual(100);
  });

  it("shows every word with the hand-checked focus letter, in order", () => {
    const actual = expected.map((paragraphs, s) =>
      paragraphs.map((_, p) =>
        words.filter((w) => w.section === s && w.paragraph === p).map(show),
      ),
    );
    expect(actual).toEqual(expected);
    expect(words.map(show)).toEqual(expected.flat(2));
  });

  it("numbers words within each paragraph and marks paragraph and heading ends", () => {
    expected.forEach((paragraphs, s) =>
      paragraphs.forEach((shown, p) => {
        const inParagraph = words.filter(
          (w) => w.section === s && w.paragraph === p,
        );
        const lastEnd = s === 0 && p === 0 ? "heading" : "paragraph";
        expect(inParagraph.map((w) => [w.word, w.end])).toEqual(
          shown.map((_, i) => [i, i === shown.length - 1 ? lastEnd : null]),
        );
      }),
    );
  });
});
