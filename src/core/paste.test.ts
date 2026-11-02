import { describe, expect, it } from "vitest";
import { pastedSections } from "./paste.ts";
import { splitText, wordText } from "./text.ts";

/** The paragraphs' texts of the one section. */
function paragraphs(text: string): string[] {
  const sections = pastedSections(text);
  expect(sections).toHaveLength(1);
  return sections[0]!.paragraphs.map((p) =>
    p.kind === "verse" ? p.lines.join("\n") : p.text,
  );
}

describe("pastedSections", () => {
  it("splits paragraphs at blank lines", () => {
    expect(paragraphs("One two.\n\nThree four.\n\nFive.")).toEqual([
      "One two.",
      "Three four.",
      "Five.",
    ]);
  });

  it("counts several blank lines, and lines of only spaces, as one break", () => {
    expect(paragraphs("One.\n\n\n\nTwo.\n  \t\nThree.\n \n\n \nFour.")).toEqual(
      ["One.", "Two.", "Three.", "Four."],
    );
  });

  it("counts a line of non-breaking spaces as blank, as web pages copy them", () => {
    expect(paragraphs("One.\n\u00a0\nTwo.\n \u00a0\u2009\n\nThree.")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ]);
  });

  it("reads Windows and old Mac line breaks", () => {
    expect(paragraphs("One.\r\n\r\nTwo.\r\rThree.")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ]);
  });

  it("gives no empty paragraph for blank lines at the start or end", () => {
    expect(paragraphs("\n\n  One.  \n\n\n")).toEqual(["One."]);
  });

  it("keeps single line breaks inside a paragraph", () => {
    expect(paragraphs("One line\nand the next.")).toEqual([
      "One line\nand the next.",
    ]);
  });

  it("gives one section with no paragraphs for empty text", () => {
    expect(pastedSections("")).toEqual([{ paragraphs: [] }]);
    expect(pastedSections(" \n\n \n")).toEqual([{ paragraphs: [] }]);
  });

  it("ends each paragraph's last word with a paragraph end", () => {
    const words = splitText(
      pastedSections("Mr. Utterson\nthe lawyer.\n\nHe was."),
    );
    expect(words.map((w) => [wordText(w), w.paragraph, w.end])).toEqual([
      ["Mr.", 0, null],
      ["Utterson", 0, null],
      ["the", 0, null],
      ["lawyer.", 0, "paragraph"],
      ["He", 1, null],
      ["was.", 1, "paragraph"],
    ]);
  });
});
