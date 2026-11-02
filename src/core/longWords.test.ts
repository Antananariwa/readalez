import { describe, expect, it } from "vitest";
import { countLetters, splitAtFocus } from "./focus.ts";
import { splitLongWord } from "./longWords.ts";

describe("splitLongWord", () => {
  it("leaves words of 13 letters or fewer whole", () => {
    expect(splitLongWord("comprehension")).toEqual(["comprehension"]);
    expect(splitLongWord("well-known")).toEqual(["well-known"]);
    expect(splitLongWord("“comprehension,”")).toEqual(["“comprehension,”"]);
  });

  it("splits a 21-letter word into two even parts with a hyphen", () => {
    expect(splitLongWord("incomprehensibilities")).toEqual([
      "incomprehen-",
      "sibilities",
    ]);
  });

  it("splits at the hyphen, then splits a part still over 13 letters", () => {
    expect(splitLongWord("Constantinople-born")).toEqual([
      "Constan-",
      "tinople-",
      "born",
    ]);
  });

  it("cuts at only as many hyphens as needed", () => {
    expect(splitLongWord("twenty-seven-year-old")).toEqual([
      "twenty-seven-",
      "year-old",
    ]);
  });

  it("splits a long web address at slashes and dots", () => {
    expect(splitLongWord("https://www.gutenberg.org/ebooks/46")).toEqual([
      "https://www.",
      "gutenberg.org/",
      "ebooks/46",
    ]);
    expect(splitLongWord("www.standardebooks.org/ebooks")).toEqual([
      "www.",
      "standar-",
      "debooks.",
      "org/ebooks",
    ]);
  });

  it("keeps leading and trailing punctuation on the first and last parts", () => {
    expect(splitLongWord("“incomprehensibilities,” —")).toEqual([
      "“incomprehen-",
      "sibilities,” —",
    ]);
  });

  it("splits by letters, so accents and digits count once", () => {
    const parts = splitLongWord("Départementalisation");
    expect(parts).toEqual(["Départemen-", "talisation"]);
    expect(splitLongWord("12345678901234567890")).toEqual([
      "1234567890-",
      "1234567890",
    ]);
  });

  it("gives every part at most 13 letters and its own focus letter", () => {
    for (const word of [
      "incomprehensibilities",
      "Constantinople-born",
      "https://www.gutenberg.org/ebooks/46",
      "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch",
    ]) {
      for (const part of splitLongWord(word)) {
        expect(countLetters(part)).toBeLessThanOrEqual(13);
        expect(splitAtFocus(part).focus).toMatch(/\p{L}|\p{N}/u);
      }
    }
    expect(splitLongWord("incomprehensibilities").map(splitAtFocus)).toEqual([
      { before: "inc", focus: "o", after: "mprehen-", letters: 11 },
      { before: "sib", focus: "i", after: "lities", letters: 10 },
    ]);
  });
});
