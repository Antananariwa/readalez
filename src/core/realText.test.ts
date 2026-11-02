// Text as it really comes in: from Gutenberg plain text, Standard Ebooks,
// web articles and European languages. Each case is a common shape the
// simple rules could get wrong.

import { describe, expect, it } from "vitest";
import { countLetters, hasLetter } from "./focus.ts";
import { MAX_LETTERS } from "./longWords.ts";
import { splitText, type Paragraph, type Word } from "./text.ts";
import { splitWords } from "./words.ts";

function show(word: Word): string {
  return `${word.before}[${word.focus}]${word.after}`;
}

function shownProse(text: string): string {
  return splitText([{ paragraphs: [{ kind: "prose", text }] }])
    .map(show)
    .join(" | ");
}

/** Input, then the shown words with their focus letters. */
const cases: [string, string, string][] = [
  // Apostrophes and quotes
  [
    "contractions and elisions",
    "’Tis o’clock, rock’n’roll ’em",
    "’T[i]s | o’c[l]ock, | ro[c]k’n’roll | ’e[m]",
  ],
  ["nested quotes", "“‘Hello,’ he said.”", "“‘H[e]llo,’ | h[e] | s[a]id.”"],
  ["brackets", "(see below)", "(s[e]e | b[e]low)"],
  ["a note marker", "[12]", "[1[2]]"],

  // Gutenberg plain text
  [
    "underscores for italics",
    "_very_ well, said Alice",
    "_v[e]ry_ | w[e]ll, | s[a]id | A[l]ice",
  ],
  ["a double hyphen as a dash", "Stop--“No!”", "S[t]op-- | “N[o]!”"],
  [
    "a spaced double hyphen",
    "He paused -- then",
    "H[e] | pa[u]sed -- | t[h]en",
  ],
  [
    "a dash at the end of a word before a quote",
    "well—“Stop!”",
    "w[e]ll— | “S[t]op!”",
  ],

  // Standard Ebooks puts a word joiner (U+2060) before em dashes.
  [
    "a word joiner before a dash",
    "mentioned\u2060—they",
    "me[n]tioned\u2060— | t[h]ey",
  ],

  // Web articles
  [
    "a spaced hyphen or en dash used as a dash",
    "word - word – word",
    "w[o]rd - | w[o]rd – | w[o]rd",
  ],
  [
    "numbers, units and symbols",
    "London–Paris and/or 3:45pm 10% £1,000 $3.50 1st",
    "Lon[d]on–Paris | a[n]d/or | 3:[4]5pm | 1[0]% | £1,[0]00 | $3.[5]0 | 1[s]t",
  ],
  ["emoji", "Great 👍 news 👨‍👩‍👧", "G[r]eat 👍 | n[e]ws 👨‍👩‍👧"],
  ["hashtags and mentions", "#reading @user", "#re[a]ding | @u[s]er"],
  [
    "abbreviations",
    "Mr. Hyde U.S.A. e.g., i.e.",
    "M[r]. | H[y]de | U.[S].A. | e.[g]., | i.[e].",
  ],
  ["Victorian &c. and R&D", "&c. R&D", "&[c]. | R&[D]"],
  [
    "ellipses before and between words",
    "…and then … and",
    "…a[n]d | t[h]en … | a[n]d",
  ],
  ["spaced dots", "Well . . . no", "W[e]ll . . . | n[o]"],
  ["a number alone", "1.", "[1]."],
  ["tabs and runs of spaces", "one\t two   three", "o[n]e | t[w]o | t[h]ree"],

  // European languages
  [
    "French spacing before ! and ?: a joined no-break space shows as a space",
    "Bonjour\u202f! Ça va ?",
    "Bo[n]jour ! | Ç[a] | v[a] ?",
  ],
  [
    "French dialogue with guillemets and no-break spaces",
    "«\u00a0Oui\u00a0», dit-il.",
    "« O[u]i », | d[i]t-il.",
  ],
  ["German quotes", "„Ja“, sagte er.", "„J[a]“, | s[a]gte | e[r]."],
  ["Spanish marks", "¡Hola! ¿Qué tal?", "¡H[o]la! | ¿Q[u]é | t[a]l?"],
  [
    "Polish, German and Turkish letters",
    "Straße Źdźbło İstanbul",
    "St[r]aße | Źd[ź]bło | İs[t]anbul",
  ],
  [
    "Russian dialogue dashes",
    "— Да, — сказал он. — Нет.",
    "— Д[а], — | ск[а]зал | о[н]. — | Н[е]т.",
  ],
  ["Greek with its question mark", "Τι κάνεις;", "Τ[ι] | κά[ν]εις;"],

  // Long words
  [
    "a German compound in three even parts",
    "Donaudampfschifffahrtsgesellschaft",
    "Don[a]udampfsc- | hif[f]fahrtsg- | ese[l]lschaft",
  ],
  [
    "a short piece then a long one",
    "anti-establishmentarianism",
    "a[n]ti- | est[a]blishme- | nta[r]ianism",
  ],
  [
    "a long word before a dash",
    "incomprehensibilities—and",
    "inc[o]mprehen- | sib[i]lities— | a[n]d",
  ],
  ["a long possessive", "Nebuchadnezzar’s", "Ne[b]uchad- | ne[z]zar’s"],
  [
    "a hyphenated word with a long part",
    "self-consciousness",
    "s[e]lf- | con[s]ciousness",
  ],
  ["13 wide capitals stay whole", "WWWWWWWWWWWWW,”", "WWW[W]WWWWWWWWW,”"],
  [
    "a long Russian word",
    "достопримечательность",
    "дос[т]опримеч- | ате[л]ьность",
  ],
];

describe("real-world text", () => {
  it.each(cases)("%s", (_, input, expected) => {
    expect(shownProse(input)).toBe(expected);
  });
});

describe("real-world paragraphs", () => {
  it("finds a scene break in text with Windows line endings", () => {
    const words = splitText([
      {
        paragraphs: [{ kind: "prose", text: "He left.\r\n* * *\r\nShe came." }],
      },
    ]);
    expect(words.map((w) => [show(w), w.end])).toEqual([
      ["H[e]", null],
      ["l[e]ft.", "paragraph"],
      ["S[h]e", null],
      ["c[a]me.", "paragraph"],
    ]);
  });

  it("accepts common scene-break shapes", () => {
    for (const mark of ["***", "* * * * *", "⁂", "———", "~", "#"]) {
      const words = splitText([
        { paragraphs: [{ kind: "prose", text: `End.\n${mark}\nStart.` }] },
      ]);
      expect(words.map((w) => w.end)).toEqual(["paragraph", "paragraph"]);
    }
  });

  it("ignores indentation and blank lines in verse", () => {
    const verse: Paragraph = {
      kind: "verse",
      lines: [
        "  How doth the little crocodile",
        "",
        "    Improve his shining tail",
      ],
    };
    const words = splitText([{ paragraphs: [verse] }]);
    expect(words.map((w) => [w.before + w.focus + w.after, w.end])).toEqual([
      ["How", null],
      ["doth", null],
      ["the", null],
      ["little", null],
      ["crocodile", "line"],
      ["Improve", null],
      ["his", null],
      ["shining", null],
      ["tail", "paragraph"],
    ]);
  });

  it("shows a chapter heading with its number", () => {
    const words = splitText([
      {
        paragraphs: [
          { kind: "heading", text: "CHAPTER I.\nDown the Rabbit-Hole" },
        ],
      },
    ]);
    expect(words.map((w) => [show(w), w.end])).toEqual([
      ["CH[A]PTER", null],
      ["[I].", null],
      ["D[o]wn", null],
      ["t[h]e", null],
      ["Rab[b]it-Hole", "heading"],
    ]);
  });
});

describe("rules that hold for every input", () => {
  const inputs = cases.map(([, input]) => input);

  it("loses no characters except spaces when splitting into words", () => {
    for (const input of inputs) {
      expect(splitWords(input).join("").replace(/\s/gu, "")).toBe(
        input.replace(/\s/gu, ""),
      );
    }
  });

  it("shows only words with a letter, a digit or &, of at most 13 letters", () => {
    for (const input of inputs) {
      for (const word of splitText([
        { paragraphs: [{ kind: "prose", text: input }] },
      ])) {
        const text = word.before + word.focus + word.after;
        expect(hasLetter(text) || text.includes("&")).toBe(true);
        expect(word.letters).toBe(countLetters(text));
        expect(word.letters).toBeLessThanOrEqual(MAX_LETTERS);
        expect(hasLetter(word.focus) || word.focus === "&").toBe(true);
        expect(text).toBe(text.trim());
      }
    }
  });
});
