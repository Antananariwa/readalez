import { describe, expect, it } from "vitest";
import {
  chapterParagraphs,
  gutenbergChapter,
  gutenbergFooter,
  gutenbergHeader,
  hardWrappedChapter,
  wrap,
} from "./fixtures/gutenbergChapter.ts";
import {
  gutenbergBody,
  parsePaste,
  suggestedTitle,
  titleFrom,
} from "./paste.ts";
import { splitText, wordText } from "./text.ts";

/** The paragraphs' texts of the one section. */
function paragraphs(text: string): string[] {
  const { sections } = parsePaste(text);
  expect(sections).toHaveLength(1);
  return sections[0]!.paragraphs.map((p) =>
    p.kind === "verse" ? p.lines.join("\n") : p.text,
  );
}

/** Paragraph texts with line breaks read as spaces, as `splitText` does. */
function joined(text: string): string[] {
  return paragraphs(text).map((p) => p.replaceAll("\n", " "));
}

describe("parsePaste: paragraphs", () => {
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
    expect(paragraphs("One.\n \nTwo.\n   \n\nThree.")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ]);
  });

  it("reads Windows and old Mac line breaks", () => {
    expect(paragraphs("One.\r\n\r\nTwo.\r\rThree.\r\nFour.")).toEqual([
      "One.",
      "Two.",
      "Three.",
      "Four.",
    ]);
  });

  it("gives no empty paragraph for blank lines at the start or end", () => {
    expect(paragraphs("\n\n  One.  \n\n\n")).toEqual(["One."]);
  });

  it("gives one section with no paragraphs for empty text", () => {
    expect(parsePaste("").sections).toEqual([{ paragraphs: [] }]);
    expect(parsePaste(" \n\n \n").sections).toEqual([{ paragraphs: [] }]);
  });

  it("joins a hard-wrapped Gutenberg chapter back into its paragraphs", () => {
    expect(joined(hardWrappedChapter)).toEqual(chapterParagraphs);
  });

  it("pauses for a paragraph only where the original paragraphs end", () => {
    const words = splitText(parsePaste(gutenbergChapter).sections);
    const ends = words.flatMap((w, i) => (w.end === "paragraph" ? [i] : []));
    const expected = splitText([
      {
        paragraphs: chapterParagraphs.map((text) => ({
          kind: "prose",
          text,
        })),
      },
    ]).flatMap((w, i) => (w.end === "paragraph" ? [i] : []));
    expect(ends).toEqual(expected);
    expect(ends).toHaveLength(chapterParagraphs.length);
  });

  it("keeps each line as a paragraph in text with one paragraph per line", () => {
    // The shape SPEC.md feature 1 gives for Safari's Reader view.
    const text = chapterParagraphs.join("\n");
    expect(paragraphs(text)).toEqual(chapterParagraphs);
  });

  it("keeps short lines without a full stop as their own paragraphs", () => {
    const text = [
      "A Walk in London",
      "By a correspondent",
      chapterParagraphs[3],
      "The door",
      chapterParagraphs[4],
      chapterParagraphs[5],
    ].join("\n");
    expect(paragraphs(text)).toHaveLength(6);
  });

  it("keeps a heading and one paragraph line as two paragraphs", () => {
    const text = `Story of the Door\n${chapterParagraphs[1]}`;
    expect(paragraphs(text)).toEqual([
      "Story of the Door",
      chapterParagraphs[1],
    ]);
  });

  it("keeps lines of similar length as paragraphs when each ends a sentence", () => {
    const lines = [
      "The street was small and quiet.",
      "The shop fronts stood in a row.",
      "The door had neither bell nor knocker.",
      "“Did you ever remark that door?”",
    ];
    expect(paragraphs(lines.join("\n"))).toEqual(lines);
  });

  it("joins text hard-wrapped at another width", () => {
    const text = chapterParagraphs
      .slice(1, 5)
      .map((p) => wrap(p, 50).join("\n"))
      .join("\n\n");
    expect(joined(text)).toEqual(chapterParagraphs.slice(1, 5));
  });

  it("reads a scene break inside hard-wrapped text", () => {
    const text = [
      ...wrap(chapterParagraphs[1]!, 70),
      "* * *",
      ...wrap(chapterParagraphs[2]!, 70),
    ].join("\n");
    const words = splitText(parsePaste(text).sections);
    const firstOfSecond = words.findIndex((w) => wordText(w) === "No");
    expect(words[firstOfSecond - 1]!.end).toBe("paragraph");
  });
});

describe("gutenbergBody", () => {
  it("leaves out the header and footer, marker lines included", () => {
    const body = gutenbergBody(gutenbergChapter);
    expect(body.trim()).toBe(hardWrappedChapter);
    expect(joined(gutenbergChapter)).toEqual(chapterParagraphs);
  });

  it("reads markers written without a space or indented", () => {
    const text =
      "Header\n  ***START OF THIS EBOOK\nBody.\n***END OF THIS EBOOK\nFooter";
    expect(gutenbergBody(text)).toBe("Body.");
  });

  it("keeps everything when only one marker is there", () => {
    const start = `${gutenbergHeader}\n\nBody.`;
    const end = `Body.\n\n${gutenbergFooter}`;
    expect(gutenbergBody(start)).toBe(start);
    expect(gutenbergBody(end)).toBe(end);
  });

  it("keeps everything when the end marker comes before the start", () => {
    const text = `${gutenbergFooter}\nBody.\n${gutenbergHeader}`;
    expect(gutenbergBody(text)).toBe(text);
  });

  it("leaves a marker mentioned inside a line alone", () => {
    const text = "He wrote *** START OF the story.\nBody.\n*** END OF it.";
    expect(gutenbergBody(text)).toBe(text);
  });
});

describe("titleFrom", () => {
  it("is the first line", () => {
    expect(titleFrom("Story of the Door\n\nMr. Utterson")).toBe(
      "Story of the Door",
    );
  });

  it("skips blank lines and collapses spaces", () => {
    expect(titleFrom("\n  \n  Story   of\tthe Door  \nMore")).toBe(
      "Story of the Door",
    );
  });

  it("keeps a line of 60 characters whole", () => {
    const line = "a".repeat(30) + " " + "b".repeat(29);
    expect(line).toHaveLength(60);
    expect(titleFrom(line)).toBe(line);
  });

  it("cuts a longer line at a word boundary to at most 60 characters", () => {
    const title = titleFrom(chapterParagraphs[1]!);
    expect(title).toBe(
      "Mr. Utterson the lawyer was a man of a rugged countenance",
    );
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it("keeps a word that ends exactly at the 60th character", () => {
    const line = "a".repeat(30) + " " + "b".repeat(29) + " more";
    expect(titleFrom(line)).toBe("a".repeat(30) + " " + "b".repeat(29));
  });

  it("cuts a first word longer than 60 characters at 60", () => {
    expect(titleFrom("w".repeat(70) + " end")).toBe("w".repeat(60));
  });

  it("counts characters outside the Basic Multilingual Plane as one", () => {
    expect(titleFrom("𝔄".repeat(70))).toBe("𝔄".repeat(60));
  });

  it("is empty for empty text", () => {
    expect(titleFrom(" \n \n")).toBe("");
  });
});

describe("suggestedTitle", () => {
  it("is the first line after Gutenberg's header", () => {
    expect(suggestedTitle(gutenbergChapter)).toBe("Story of the Door");
    expect(parsePaste(gutenbergChapter).title).toBe("Story of the Door");
  });
});
