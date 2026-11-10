// EPUB import on the fixture books (SPEC.md feature 2, issue #14). These
// tests read files, which tests in src/core can't (ADR 0009), so they live
// here. The fixtures and where they come from: tests/fixtures/epub/README.md.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseEpub, type Chapter, type EpubBook } from "../../src/core/epub.ts";
import {
  firstWordAt,
  flowStart,
  inFlow,
  readingFlow,
  skippedEntries,
} from "../../src/core/readingFlow.ts";
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

/** Each chapter's title and depth only. */
function chapterTitles(book: EpubBook) {
  return book.chapters.map((chapter) => [chapter.title, chapter.depth]);
}

/**
 * The kinds of the paragraphs the chapters start at; the first and last two
 * are Gutenberg's header, footer and license.
 */
function chapterStartKinds(book: EpubBook, chapters: readonly Chapter[]) {
  return new Set(
    chapters.map(
      (chapter) =>
        book.sections[chapter.section]!.paragraphs[chapter.paragraph]!.kind,
    ),
  );
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

// Project Gutenberg's books, downloaded by the owner (README.md). The chapter
// titles are as written in each book's nav document or NCX. Each book has an
// empty first section: its spine starts with a page holding only the cover.

describe("Gutenberg: Alice's Adventures in Wonderland (EPUB 3)", async () => {
  const book = await load("gutenberg-11-alice-in-wonderland-epub3.epub");
  const words = splitText(book.sections);

  it("takes the title, author and spine", () => {
    expect(book.title).toBe("Alice's Adventures in Wonderland");
    expect(book.author).toBe("Lewis Carroll");
    expect(book.sections).toHaveLength(15);
    expect(book.sections[0]!.paragraphs).toEqual([]);
  });

  it("takes the chapter list from the nav, each at a heading, and adds Gutenberg's header and footer", () => {
    expect(chapterTitles(book)).toEqual([
      ["The Project Gutenberg eBook of Alice's Adventures in", 0],
      ["Alice’s Adventures in Wonderland", 0],
      ["THE MILLENNIUM FULCRUM EDITION 3.0", 0],
      ["Contents", 0],
      ["CHAPTER I. Down the Rabbit-Hole", 0],
      ["CHAPTER II. The Pool of Tears", 0],
      ["CHAPTER III. A Caucus-Race and a Long Tale", 0],
      ["CHAPTER IV. The Rabbit Sends in a Little Bill", 0],
      ["CHAPTER V. Advice from a Caterpillar", 0],
      ["CHAPTER VI. Pig and Pepper", 0],
      ["CHAPTER VII. A Mad Tea-Party", 0],
      ["CHAPTER VIII. The Queen’s Croquet-Ground", 0],
      ["CHAPTER IX. The Mock Turtle’s Story", 0],
      ["CHAPTER X. The Lobster Quadrille", 0],
      ["CHAPTER XI. Who Stole the Tarts?", 0],
      ["CHAPTER XII. Alice’s Evidence", 0],
      ["*** END OF THE PROJECT GUTENBERG EBOOK ALICE'S ADVENTURES IN", 0],
      ["THE FULL PROJECT GUTENBERG™ LICENSE", 0],
    ]);
    expect(chapterStartKinds(book, book.chapters.slice(1, -2))).toEqual(
      new Set(["heading"]),
    );
  });

  it("reads each stanza of “How doth the little crocodile” as verse, with a pause after each line", () => {
    const first = words.find((w) => wordText(w) === "“How")!;
    const poem = words.filter(
      (w) =>
        w.section === first.section &&
        (w.paragraph === first.paragraph ||
          w.paragraph === first.paragraph + 1),
    );
    const paragraphs = book.sections[first.section]!.paragraphs;
    expect(paragraphs.slice(first.paragraph, first.paragraph + 2)).toEqual([
      {
        kind: "verse",
        lines: [
          "“How doth the little crocodile",
          "Improve his shining tail,",
          "And pour the waters of the Nile",
          "On every golden scale!",
        ],
      },
      {
        kind: "verse",
        lines: [
          "“How cheerfully he seems to grin,",
          "How neatly spread his claws,",
          "And welcome little fishes in",
          "With gently smiling jaws!”",
        ],
      },
    ]);
    // A stanza's last line ends with the paragraph pause instead.
    expect(poem.filter((w) => w.end === "line").map(wordText)).toEqual([
      "crocodile",
      "tail,",
      "Nile",
      "grin,",
      "claws,",
      "in",
    ]);
  });

  it("has no soft hyphens, zero-width characters or no-break spaces", () => {
    expect(words.filter((w) => UNWANTED.test(wordText(w)))).toEqual([]);
  });
});

describe("Gutenberg: Pride and Prejudice (EPUB 2, no images)", async () => {
  const book = await load("gutenberg-1342-pride-and-prejudice-epub2.epub");

  it("takes the title, author and spine", () => {
    expect(book.title).toBe("Pride and Prejudice");
    expect(book.author).toBe("Jane Austen");
    expect(book.sections).toHaveLength(17);
  });

  it("takes the chapter list from the NCX, each at a heading, and adds the parts it leaves out", () => {
    // 63 navPoints. Gutenberg's labels keep the captions of the illustrations
    // left out of this edition, as in "I hope Mr. Bingley will like it." (#80)
    // The NCX lists neither the preface nor the list of illustrations.
    const titles = chapterTitles(book);
    expect(titles).toHaveLength(67);
    expect(titles.slice(0, 7)).toEqual([
      ["The Project Gutenberg eBook of Pride and Prejudice", 0],
      ["PRIDE. and PREJUDICE", 0],
      ["PREFACE.", 0],
      ["List of Illustrations.", 0],
      ["Chapter I.", 0],
      ["I hope Mr. Bingley will like it. CHAPTER II.", 0],
      ["He rode a black horse. CHAPTER III.", 0],
    ]);
    expect(titles.slice(-3)).toEqual([
      ["CHAPTER LXI.", 0],
      ["*** END OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE", 0],
      ["THE FULL PROJECT GUTENBERG™ LICENSE", 0],
    ]);
    expect(chapterStartKinds(book, book.chapters.slice(1, -2))).toEqual(
      new Set(["heading"]),
    );
  });

  it("drops the illustrations' captions from the text", () => {
    const text = splitText(book.sections).map(wordText).join(" ");
    expect(text).not.toContain("He rode a black horse.");
  });
});

describe("Gutenberg: Romeo and Juliet (EPUB 3)", async () => {
  const book = await load("gutenberg-1513-romeo-and-juliet-epub3.epub");

  it("takes the title, author and spine", () => {
    expect(book.title).toBe("Romeo and Juliet");
    expect(book.author).toBe("William Shakespeare");
    expect(book.sections).toHaveLength(10);
  });

  it("takes the acts and their scenes from the nav, each at a heading", () => {
    const titles = chapterTitles(book);
    expect(titles).toHaveLength(37);
    expect(titles.slice(5, 9)).toEqual([
      ["THE PROLOGUE", 0],
      ["ACT I", 0],
      ["SCENE I. A public place.", 1],
      ["SCENE II. A Street.", 1],
    ]);
    expect(chapterStartKinds(book, book.chapters.slice(1, -2))).toEqual(
      new Set(["heading"]),
    );
  });

  it("keeps a speaker's name as the first line of the speech", () => {
    // How speaker names should read is #79.
    const act = book.sections[4]!.paragraphs;
    expect(act[3]).toEqual({
      kind: "prose",
      text: "SAMPSON.\nGregory, on my word, we’ll not carry coals.",
    });
  });
});

describe("Gutenberg: The Adventures of Sherlock Holmes (EPUB 3)", async () => {
  const book = await load("gutenberg-1661-sherlock-holmes-epub3.epub");

  it("takes the title, author and spine", () => {
    expect(book.title).toBe("The Adventures of Sherlock Holmes");
    expect(book.author).toBe("Arthur Conan Doyle");
    expect(book.sections).toHaveLength(15);
  });

  it("takes the stories and their parts from the nav, each at a heading", () => {
    const titles = chapterTitles(book);
    expect(titles).toHaveLength(20);
    expect(titles.slice(0, 8)).toEqual([
      ["The Project Gutenberg eBook of The Adventures of Sherlock", 0],
      ["The Adventures of Sherlock Holmes", 0],
      ["Contents", 0],
      ["I. A SCANDAL IN BOHEMIA", 0],
      ["I.", 1],
      ["II.", 1],
      ["III.", 1],
      ["II. THE RED-HEADED LEAGUE", 0],
    ]);
    expect(chapterStartKinds(book, book.chapters.slice(1, -2))).toEqual(
      new Set(["heading"]),
    );
  });
});

describe("Gutenberg: Moby Dick (EPUB 3)", async () => {
  const book = await load("gutenberg-2701-moby-dick-epub3.epub");

  it("takes the title, author and spine", () => {
    expect(book.title).toBe("Moby Dick; Or, The Whale");
    expect(book.author).toBe("Herman Melville");
    expect(book.sections).toHaveLength(13);
  });

  it("has Gutenberg's header, the title page, the contents and chapters 1 to 7 in one spine item", () => {
    const sectionOf = (title: string) =>
      book.chapters.find((chapter) => chapter.title === title)?.section;
    expect(sectionOf("ETYMOLOGY.")).toBe(1);
    expect(sectionOf("CHAPTER 1. Loomings.")).toBe(1);
    expect(sectionOf("CHAPTER 7. The Chapel.")).toBe(1);
    expect(sectionOf("CHAPTER 8. The Pulpit.")).toBe(2);
  });

  it("takes the front matter, 135 chapters and the epilogue from the nav, each at a heading", () => {
    const titles = chapterTitles(book);
    expect(titles).toHaveLength(147);
    expect(titles.slice(0, 7)).toEqual([
      ["The Project Gutenberg eBook of Moby Dick; Or, The Whale", 0],
      ["MOBY-DICK; or, THE WHALE.", 0],
      ["ETYMOLOGY.", 0],
      ["(Supplied by a Late Consumptive Usher to a Grammar School.)", 1],
      ["EXTRACTS. (Supplied by a Sub-Sub-Librarian).", 0],
      ["EXTRACTS.", 1],
      ["CHAPTER 1. Loomings.", 0],
    ]);
    expect(titles.slice(-5)).toEqual([
      ["CHAPTER 135. The Chase.—Third Day.", 0],
      ["Epilogue", 0],
      ["“AND I ONLY AM ESCAPED ALONE TO TELL THEE” Job.", 1],
      ["*** END OF THE PROJECT GUTENBERG EBOOK MOBY DICK; OR, THE", 0],
      ["THE FULL PROJECT GUTENBERG™ LICENSE", 0],
    ]);
    expect(chapterStartKinds(book, book.chapters.slice(1, -2))).toEqual(
      new Set(["heading"]),
    );
  });
});

// The reading flow (SPEC.md feature 2, issue #15): where each book starts
// and ends, and what it skips.
describe("Gutenberg: A Connecticut Yankee in King Arthur's Court (EPUB 3)", async () => {
  const book = await load("gutenberg-86-connecticut-yankee-epub3.epub");
  const words = splitText(book.sections);
  const flow = readingFlow(words, book.parts);
  const read = words.filter((_, i) => inFlow(flow, i)).map(wordText);

  it("keeps its two footnotes written into the paragraphs in the flow, as text", () => {
    // Plain text, no link or markup (docs/known-issues.md).
    const text = read.join(" ");
    expect(text).toContain(
      "No force,* [*Footnote from M.T.: No matter.] said Merlin",
    );
    expect(text.match(/\[\*Footnote/g)).toHaveLength(2);
    expect(book.chapters.map((chapter) => chapter.title)).not.toContain(
      "Notes",
    );
  });
});

describe("reading flow", async () => {
  const cases = [
    {
      file: "standard-ebooks-a-christmas-carol.epub",
      first: "Preface I have endeavoured",
      last: "Bless Us, Every One!”",
      skipped: ["Titlepage", "A Christmas Carol", "Colophon"],
    },
    {
      file: "gutenberg-11-alice-in-wonderland-epub3.epub",
      first: "CHAPTER I. Down the",
      last: "summer days. THE END",
      skipped: [
        "The Project Gutenberg eBook of Alice's Adventures in",
        "*** END OF THE PROJECT GUTENBERG EBOOK ALICE'S ADVENTURES IN",
      ],
    },
    {
      file: "gutenberg-1342-pride-and-prejudice-epub2.epub",
      first: "PREFACE. Walt Whitman has",
      // The printer's imprint after the novel stays (docs/known-issues.md).
      last: "CHANCERY LANE, LONDON.",
      skipped: [
        "The Project Gutenberg eBook of Pride and Prejudice",
        "List of Illustrations.",
        "*** END OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE",
      ],
    },
    {
      file: "gutenberg-1661-sherlock-holmes-epub3.epub",
      first: "I. A SCANDAL IN",
      last: "with considerable success.",
      skipped: [
        "The Project Gutenberg eBook of The Adventures of Sherlock",
        "*** END OF THE PROJECT GUTENBERG EBOOK THE ADVENTURES OF",
      ],
    },
    {
      file: "gutenberg-2701-moby-dick-epub3.epub",
      first: "ETYMOLOGY. (Supplied by a",
      last: "only found another orphan.",
      skipped: [
        "The Project Gutenberg eBook of Moby Dick; Or, The Whale",
        "*** END OF THE PROJECT GUTENBERG EBOOK MOBY DICK; OR, THE",
      ],
    },
    {
      file: "gutenberg-86-connecticut-yankee-epub3.epub",
      first: "PREFACE The ungentle laws",
      last: "never finished it.",
      skipped: [
        "The Project Gutenberg eBook of A Connecticut Yankee in King",
        "A CONNECTICUT YANKEE IN KING ARTHUR’S COURT",
        "CONTENTS:",
        "*** END OF THE PROJECT GUTENBERG EBOOK A CONNECTICUT YANKEE",
      ],
    },
  ];

  for (const { file, first, last, skipped } of cases) {
    describe(file, async () => {
      const book = await load(file);
      const words = splitText(book.sections);
      const flow = readingFlow(words, book.parts);
      const read = words.filter((_, i) => inFlow(flow, i)).map(wordText);

      it("starts where the author's text starts and ends with the author's last words", () => {
        expect(read.slice(0, first.split(" ").length).join(" ")).toBe(first);
        expect(read.slice(-last.split(" ").length).join(" ")).toBe(last);
        expect(wordText(words[flowStart(flow)]!)).toBe(first.split(" ")[0]);
      });

      it("has no license, header or contents words in it", () => {
        const text = read.join(" ");
        expect(text).not.toMatch(/gutenberg|\*\*\*|standard ?ebooks/i);
        expect(read).not.toContain("Contents");
      });

      it("lists each skipped part in the chapter list", () => {
        const marked = skippedEntries(
          flow,
          book.chapters.map((chapter) => firstWordAt(words, chapter)),
        );
        const titles = book.chapters
          .filter((_, i) => marked[i])
          .map((chapter) => chapter.title);
        for (const title of skipped) expect(titles).toContain(title);
      });
    });
  }
});
