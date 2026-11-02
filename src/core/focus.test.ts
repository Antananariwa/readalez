import { describe, expect, it } from "vitest";
import { countLetters, focusPosition, splitAtFocus } from "./focus.ts";

/** Shows a word with its focus letter in brackets: `H[e]llo`. */
function show(word: string): string {
  const { before, focus, after } = splitAtFocus(word);
  return `${before}[${focus}]${after}`;
}

describe("focusPosition", () => {
  it("follows the table for 1 to 13 letters", () => {
    const positions = Array.from({ length: 13 }, (_, i) =>
      focusPosition(i + 1),
    );
    expect(positions).toEqual([1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]);
  });
});

describe("splitAtFocus", () => {
  it("highlights the letter the table gives for words of 1 to 13 letters", () => {
    expect(
      [
        "a",
        "an",
        "the",
        "word",
        "words",
        "reader",
        "reading",
        "speeding",
        "beautiful",
        "conclusion",
        "intelligent",
        "relationship",
        "comprehension",
      ].map(show),
    ).toEqual([
      "[a]",
      "a[n]",
      "t[h]e",
      "w[o]rd",
      "w[o]rds",
      "re[a]der",
      "re[a]ding",
      "sp[e]eding",
      "be[a]utiful",
      "con[c]lusion",
      "int[e]lligent",
      "rel[a]tionship",
      "com[p]rehension",
    ]);
  });

  it("ignores leading and trailing punctuation", () => {
    expect(splitAtFocus('"Hello,')).toEqual({
      before: '"H',
      focus: "e",
      after: "llo,",
      letters: 5,
    });
    expect(show("“I")).toBe("“[I]");
    expect(show("(don’t)")).toBe("(d[o]n’t)");
  });

  it("counts digits as letters", () => {
    expect(show("12th,")).toBe("1[2]th,");
    expect(show("1,000.50")).toBe("1,0[0]0.50");
  });

  it("counts and highlights an accented letter as one, however it's encoded", () => {
    const composed = "rêve";
    const decomposed = "rêve";
    expect(splitAtFocus(composed)).toMatchObject({ focus: "ê", letters: 4 });
    expect(splitAtFocus(decomposed)).toMatchObject({
      before: "r",
      focus: "ê",
      after: "ve",
      letters: 4,
    });
    expect(splitAtFocus("é")).toMatchObject({ focus: "é", letters: 1 });
    expect(splitAtFocus("é")).toMatchObject({ focus: "é", letters: 1 });
    expect(countLetters("café")).toBe(4);
  });

  it("follows the table for Greek and Cyrillic words", () => {
    expect(show("λόγος")).toBe("λ[ό]γος");
    expect(show("λόγος")).toBe("λ[ό]γος");
    expect(show("άνθρωπος")).toBe("άν[θ]ρωπος");
    expect(show("Привет")).toBe("Пр[и]вет");
    expect(show("достопримечательность")).toBe("дост[о]примечательность");
  });

  it("treats « » „ “ ‹ › ¿ ¡ as punctuation, not letters", () => {
    expect(show("«Привет»")).toBe("«Пр[и]вет»");
    expect(show("„Hallo“")).toBe("„H[a]llo“");
    expect(show("‹oui›")).toBe("‹o[u]i›");
    expect(show("¿Qué?")).toBe("¿Q[u]é?");
    expect(show("¡Olé!")).toBe("¡O[l]é!");
    expect(countLetters("«»„“‹›¿¡")).toBe(0);
  });

  it("focuses the first character of a word with no letters", () => {
    expect(splitAtFocus("&")).toEqual({
      before: "",
      focus: "&",
      after: "",
      letters: 0,
    });
  });
});
