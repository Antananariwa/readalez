import { describe, expect, it } from "vitest";
import { bookId, bookText, sha256Hex } from "./bookId.ts";
import { gutenbergChapter } from "./fixtures/gutenbergChapter.ts";
import { parsePaste } from "./paste.ts";
import type { Section } from "./text.ts";

describe("sha256Hex", () => {
  // Expected values made with Node's `crypto.createHash("sha256")`. The first
  // three are also the examples FIPS 180-4's SHA-256 is usually checked with.
  it.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    ],
    [
      "Żółć — 😀 ü",
      "5f4fb022b66660a8d325e2dd860b3f09996e3a13881039171190cc2e41004f40",
    ],
    // Lengths around the 64-byte block, where the padding spills over.
    [
      "x".repeat(55),
      "d5e285683cd4efc02d021a5c62014694958901005d6f71e89e0989fac77e4072",
    ],
    [
      "x".repeat(56),
      "04c26261370ee7541549d16dee320c723e3fd14671e66a099afe0a377c16888e",
    ],
    [
      "x".repeat(64),
      "7ce100971f64e7001e8fe5a51973ecdfe1ced42befe7ee8d5fd6219506b5393c",
    ],
  ])("hashes %j", (text, hash) => {
    expect(sha256Hex(text)).toBe(hash);
  });
});

describe("bookId", () => {
  const prose = (text: string): Section => ({
    paragraphs: [{ kind: "prose", text }],
  });

  it("gives the same text the same ID every time", () => {
    const first = bookId(parsePaste(gutenbergChapter).sections);
    const second = bookId(parsePaste(gutenbergChapter).sections);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toBe(first);
  });

  it("gives texts one character apart different IDs", () => {
    const text = parsePaste(gutenbergChapter);
    const changed = parsePaste(
      gutenbergChapter.replace("Utterson", "Uttersen"),
    );
    expect(bookId(changed.sections)).not.toBe(bookId(text.sections));
  });

  it("takes only the words: paragraph kinds stay out", () => {
    const asHeading: Section = {
      paragraphs: [{ kind: "heading", text: "Chapter 1" }],
    };
    expect(bookId([asHeading])).toBe(bookId([prose("Chapter 1")]));
  });

  it("joins verse lines with line breaks and paragraphs with blank lines", () => {
    const sections: Section[] = [
      {
        paragraphs: [
          { kind: "heading", text: "Song" },
          { kind: "verse", lines: ["One line,", "another."] },
        ],
      },
      prose("Next section."),
    ];
    expect(bookText(sections)).toBe(
      "Song\n\nOne line,\nanother.\n\nNext section.",
    );
  });
});
