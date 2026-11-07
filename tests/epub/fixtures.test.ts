// EPUB import on the fixture books (SPEC.md feature 2, issue #14). These
// tests read files, which tests in src/core can't (ADR 0009), so they live
// here. The fixtures and where they come from: tests/fixtures/epub/README.md.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseEpub, type EpubBook } from "../../src/core/epub.ts";
import { splitText, wordText, type Paragraph } from "../../src/core/text.ts";

const FIXTURES = new URL("../fixtures/epub/", import.meta.url);

function load(name: string): Promise<EpubBook> {
  const bytes = new Uint8Array(readFileSync(new URL(name, FIXTURES)));
  return parseEpub(bytes, name);
}

function paragraphText(paragraph: Paragraph): string {
  return paragraph.kind === "verse"
    ? paragraph.lines.join("\n")
    : paragraph.text;
}

/** Every chapter's title, depth, and the text of the paragraph it starts at. */
function chapterStarts(book: EpubBook) {
  return book.chapters.map((chapter) => [
    chapter.title,
    chapter.depth,
    paragraphText(
      book.sections[chapter.section]!.paragraphs[chapter.paragraph]!,
    ),
  ]);
}

/** Soft hyphens, zero-width characters and no-break spaces. */
const UNWANTED =
  /\u00ad|\u200b|\u200c|\u200d|\u2060|\ufeff|\u00a0|\u2007|\u202f/u;

describe("Standard Ebooks: A Christmas Carol (EPUB 3)", async () => {
  const book = await load("standard-ebooks-a-christmas-carol.epub");
  const words = splitText(book.sections);

  it("takes the title and author from the metadata", () => {
    expect(book.title).toBe("A Christmas Carol");
    expect(book.author).toBe("Charles Dickens");
  });

  it("has one section per spine item", () => {
    expect(book.sections).toHaveLength(11);
  });

  it("takes the chapter list from the table of contents, each at its heading", () => {
    // As written in the fixture's epub/toc.xhtml.
    expect(chapterStarts(book)).toEqual([
      ["Titlepage", 0, "A Christmas Carol"],
      ["Imprint", 0, "Imprint"],
      ["Preface", 0, "Preface"],
      ["A Christmas Carol", 0, "A Christmas Carol"],
      ["Stave I: Marley’s Ghost", 1, "Stave I"],
      ["Stave II: The First of the Three Spirits", 1, "Stave II"],
      ["Stave III: The Second of the Three Spirits", 1, "Stave III"],
      ["Stave IV: The Last of the Spirits", 1, "Stave IV"],
      ["Stave V: The End of It", 1, "Stave V"],
      ["Colophon", 0, "Colophon"],
      ["Uncopyright", 0, "Uncopyright"],
    ]);
  });

  it("drops the images and their alt text", () => {
    const text = words.map(wordText).join(" ");
    // The imprint's logo has the alt text "The Standard Ebooks logo."
    expect(text).not.toContain("logo.");
    expect(book.sections[0]!.paragraphs).toEqual([
      { kind: "heading", text: "A Christmas Carol" },
      { kind: "prose", text: "By Charles Dickens." },
    ]);
  });

  it("has no soft hyphens, zero-width characters or no-break spaces", () => {
    expect(words.filter((w) => UNWANTED.test(wordText(w)))).toEqual([]);
  });

  it("reads the song in Stave I as verse, with a line-break pause after each line", () => {
    const song = words.filter((w) => w.section === 4 && w.end === "line");
    expect(song.map(wordText)).toEqual(["gentleman,"]);
    const paragraph = book.sections[4]!.paragraphs[song[0]!.paragraph];
    expect(paragraph).toEqual({
      kind: "verse",
      lines: ["“God bless you, merry gentleman,", "May nothing you dismay!”"],
    });
  });

  it("keeps the word joiners' em dashes as dashes", () => {
    expect(words.map(wordText)).toContain("spot—");
  });
});
