import { describe, expect, it } from "vitest";
import { isSceneBreak, splitWords } from "./words.ts";

describe("splitWords", () => {
  it("splits at spaces and keeps punctuation attached", () => {
    expect(splitWords("“Hello,” she said.\nThen  left.")).toEqual([
      "“Hello,”",
      "she",
      "said.",
      "Then",
      "left.",
    ]);
  });

  it("keeps hyphenated words and numbers whole", () => {
    expect(splitWords("a well-known sum of 1,000.50")).toEqual([
      "a",
      "well-known",
      "sum",
      "of",
      "1,000.50",
    ]);
  });

  it("splits words joined by a dash, keeping the dash on the first", () => {
    expect(splitWords("yes—no")).toEqual(["yes—", "no"]);
    expect(splitWords("yes--no")).toEqual(["yes--", "no"]);
    expect(splitWords("Besides—excuse me—I")).toEqual([
      "Besides—",
      "excuse",
      "me—",
      "I",
    ]);
  });

  it("doesn't split at an en dash, or where one side has no letters", () => {
    expect(splitWords("1914–1918")).toEqual(["1914–1918"]);
    expect(splitWords("—Hello")).toEqual(["—Hello"]);
    expect(splitWords("I was—”")).toEqual(["I", "was—”"]);
  });

  it("joins a spaced dash or ellipsis to the word before it, with its space", () => {
    expect(splitWords("He paused — then left")).toEqual([
      "He",
      "paused —",
      "then",
      "left",
    ]);
    expect(splitWords("He paused -- then")).toEqual([
      "He",
      "paused --",
      "then",
    ]);
    expect(splitWords("“My dear sir …” began")).toEqual([
      "“My",
      "dear",
      "sir …”",
      "began",
    ]);
    expect(splitWords("Well . . . no")).toEqual(["Well . . .", "no"]);
  });

  it("joins opening marks, and symbols with nothing before them, to the next word", () => {
    expect(splitWords("Il dit « Bonjour » et part.")).toEqual([
      "Il",
      "dit",
      "« Bonjour »",
      "et",
      "part.",
    ]);
    expect(splitWords("¿ Qué ?")).toEqual(["¿ Qué ?"]);
    expect(splitWords("— Привет, — сказал он.")).toEqual([
      "— Привет, —",
      "сказал",
      "он.",
    ]);
  });

  it("shows & as a word", () => {
    expect(splitWords("Scrooge & Marley")).toEqual(["Scrooge", "&", "Marley"]);
  });

  it("shows nothing for a run of symbols", () => {
    expect(splitWords("* * *")).toEqual([]);
    expect(splitWords("   ")).toEqual([]);
  });
});

describe("isSceneBreak", () => {
  it("is true for a line of only symbols", () => {
    expect(isSceneBreak("* * *")).toBe(true);
    expect(isSceneBreak("  ⁂ ")).toBe(true);
  });

  it("is false for blank lines, words and &", () => {
    expect(isSceneBreak("")).toBe(false);
    expect(isSceneBreak("Stave I")).toBe(false);
    expect(isSceneBreak("&")).toBe(false);
  });
});
