import { describe, expect, it } from "vitest";
import { parseEpub, type EpubBook } from "../epub.ts";
import { flowStart, inFlow, readingFlow } from "../readingFlow.ts";
import { splitText, wordText } from "../text.ts";
import { testEpub, type TestBook } from "./testZip.ts";

const load = (book: TestBook) =>
  parseEpub(
    testEpub({ metadata: "<dc:title>The Book</dc:title>", ...book }),
    "book.epub",
  );

/** The reading flow's words, and the skipped ones, as text. */
function flowOf(book: EpubBook) {
  const words = splitText(book.sections);
  const flow = readingFlow(words, book.parts);
  const join = (keep: boolean) =>
    words
      .filter((_, i) => inFlow(flow, i) === keep)
      .map(wordText)
      .join(" ");
  return {
    read: join(true),
    skipped: join(false),
    first: wordText(words[flowStart(flow)]!),
  };
}

const titles = (book: EpubBook) => book.chapters.map((c) => c.title);

describe("findParts: EPUB 3 semantics, as Standard Ebooks marks them", () => {
  const book = load({
    documents: {
      "titlepage.xhtml": `<section epub:type="titlepage"><h1>The Book</h1><p>By Someone.</p></section>`,
      "imprint.xhtml": `<section epub:type="imprint"><h2>Imprint</h2><p>Made by volunteers.</p></section>`,
      "preface.xhtml": `<section epub:type="preface"><h2>Preface</h2><p>Kind words.</p></section>`,
      "halftitle.xhtml": `<section epub:type="halftitlepage"><h2>The Book</h2></section>`,
      "one.xhtml": `<section epub:type="chapter"><h2>One</h2><p>It began.</p></section>`,
      "two.xhtml": `<section epub:type="chapter"><h2>Two</h2><p>It ended.</p></section>`,
      "colophon.xhtml": `<section epub:type="colophon"><h2>Colophon</h2><p>Set in type.</p></section>`,
    },
  });

  it("starts at the preface and ends with the author's last words, skipping the half-title between", async () => {
    const { read, skipped, first } = flowOf(await book);
    expect(first).toBe("Preface");
    expect(read).toBe("Preface Kind words. One It began. Two It ended.");
    expect(skipped).toBe(
      "The Book By Someone. Imprint Made by volunteers. The Book Colophon Set in type.",
    );
  });

  it("lists every part, from its first paragraph, with no table of contents", async () => {
    expect(titles(await book)).toEqual([
      "The Book",
      "Imprint",
      "Preface",
      "The Book",
      "One",
      "Two",
      "Colophon",
    ]);
  });
});

describe("findParts: Gutenberg's markers and section titles", () => {
  const header = `<header class="pg-boilerplate" id="pg-header"><h2>The Project Gutenberg eBook of The Book</h2><p>Use it freely.</p><div id="pg-start-separator"><span>*** START OF THE PROJECT GUTENBERG EBOOK THE BOOK ***</span></div></header>`;
  const footer = `<footer class="pg-boilerplate" id="pg-footer"><div id="pg-end-separator"><span>*** END OF THE PROJECT GUTENBERG EBOOK THE BOOK ***</span></div><h2>THE FULL PROJECT GUTENBERG LICENSE</h2><p>Terms.</p></footer>`;
  const book = load({
    documents: {
      "front.xhtml": `${header}
        <p>THERE IS AN ILLUSTRATED EDITION.</p>
        <h1 id="t">THE BOOK.</h1><h2>by Someone</h2>
        <h4 id="e">THE FIRST EDITION</h4>
        <h2 id="c">Contents</h2><p><a href="one.xhtml">Chapter I</a></p>
        <h2 id="p">PREFACE.</h2><p>Kind words.</p>
        <h2 id="l">List of Illustrations.</h2><p>A picture, page 3.</p>`,
      "one.xhtml": `<h2 id="one">CHAPTER I.</h2><p>It began. The book was read.</p>`,
      "two.xhtml": `<h2>CHAPTER II.</h2><p>It ended.</p><h3>THE END</h3>${footer}`,
    },
    nav: `<nav epub:type="toc"><ol>
      <li><a href="front.xhtml#t">THE BOOK.</a></li>
      <li><a href="front.xhtml#e">THE FIRST EDITION</a></li>
      <li><a href="front.xhtml#c">Contents</a></li>
      <li><a href="one.xhtml#one">CHAPTER I.</a></li>
      <li><a href="two.xhtml">CHAPTER II.</a></li>
    </ol></nav>`,
  });

  it("skips the header, title page, contents and list of illustrations, and keeps the preface", async () => {
    const { read, first } = flowOf(await book);
    expect(first).toBe("PREFACE.");
    expect(read).toBe(
      "PREFACE. Kind words. CHAPTER I. It began. The book was read. CHAPTER II. It ended. THE END",
    );
  });

  it("adds an entry for each part the table of contents leaves out", async () => {
    expect(titles(await book)).toEqual([
      "The Project Gutenberg eBook of The Book",
      "THE BOOK.",
      "THE FIRST EDITION",
      "Contents",
      "PREFACE.",
      "List of Illustrations.",
      "CHAPTER I.",
      "CHAPTER II.",
      "*** END OF THE PROJECT GUTENBERG EBOOK THE BOOK ***",
    ]);
  });

  it("matches the book's title only before the author's text", async () => {
    const later = await load({
      documents: {
        "one.xhtml": `<h2>Chapter One</h2><p>It began.</p><h2>The Book</h2><p>A chapter named for the book.</p>`,
      },
    });
    expect(flowOf(later).read).toBe(
      "Chapter One It began. The Book A chapter named for the book.",
    );
  });
});

describe("findParts: EPUB 2's guide", () => {
  it("skips the documents the guide marks as paperwork", async () => {
    const book = await load({
      version: "2.0",
      documents: {
        "title.xhtml": `<p>Some Publisher, 1900.</p>`,
        "one.xhtml": `<h1>One</h1><p>It began.</p>`,
        "copyright.xhtml": `<p>All rights reserved.</p>`,
      },
      guide: `<reference type="title-page" href="title.xhtml"/><reference type="text" href="one.xhtml"/><reference type="copyright-page" href="copyright.xhtml"/>`,
    });
    expect(flowOf(book).read).toBe("One It began.");
  });
});

describe("findParts: books with no paperwork found", () => {
  it("reads the whole book", async () => {
    const book = await load({
      documents: { "one.xhtml": `<p>Just text.</p><p>More text.</p>` },
    });
    expect(book.parts).toEqual([{ section: 0, paragraph: 0, skipped: false }]);
    expect(flowOf(book).read).toBe("Just text. More text.");
  });
});

describe("notes (SPEC.md feature 2)", () => {
  const book = load({
    documents: {
      "one.xhtml": `<h1>One</h1><p>It began<a epub:type="noteref" href="notes.xhtml#n1">1</a>.</p><aside epub:type="footnote" id="f1"><p>An inline note.</p></aside><p>Then more.</p>`,
      "notes.xhtml": `<section epub:type="endnotes"><h2 id="h">Notes</h2><ol><li id="n1"><p>An endnote.</p></li></ol></section>`,
    },
    nav: `<nav epub:type="toc"><ol><li><a href="one.xhtml">One</a></li><li><a href="notes.xhtml#h">Endnotes</a></li></ol></nav>`,
  });

  it("go into one section after the spine's, outside the flow", async () => {
    const loaded = await book;
    expect(loaded.sections).toHaveLength(3);
    expect(loaded.sections[1]!.paragraphs).toEqual([]);
    expect(loaded.sections[2]!.paragraphs).toEqual([
      { kind: "prose", text: "An inline note." },
      { kind: "heading", text: "Notes" },
      { kind: "prose", text: "An endnote." },
    ]);
    const { read, skipped } = flowOf(loaded);
    expect(read).toBe("One It began. Then more.");
    expect(skipped).toBe("An inline note. Notes An endnote.");
  });

  it("are reached from the chapter list, where links into them point there", async () => {
    const loaded = await book;
    expect(loaded.chapters).toEqual([
      { title: "One", depth: 0, section: 0, paragraph: 0 },
      { title: "Notes", depth: 0, section: 2, paragraph: 0 },
      { title: "Endnotes", depth: 0, section: 2, paragraph: 1 },
    ]);
  });
});

describe("findParts: a story under its own title", () => {
  it("keeps the text when the book's title heads it, and still skips Gutenberg's header and footer", async () => {
    const book = await load({
      metadata: "<dc:title>The Gift of the Magi</dc:title>",
      documents: {
        "story.xhtml": `<header class="pg-boilerplate" id="pg-header"><p>Header.</p></header>
          <h1>THE GIFT OF THE MAGI</h1><p>by O. Henry</p><p>One dollar and eighty-seven cents.</p>
          <footer class="pg-boilerplate" id="pg-footer"><p>License.</p></footer>`,
      },
    });
    expect(flowOf(book).read).toBe(
      "THE GIFT OF THE MAGI by O. Henry One dollar and eighty-seven cents.",
    );
  });
});

describe("notes: a table of contents link to a notes document", () => {
  it("leads to where its notes went", async () => {
    const book = await load({
      documents: {
        "one.xhtml": `<h1>One</h1><p>It began.</p>`,
        "notes.xhtml": `<section epub:type="endnotes" role="doc-endnotes"><ol><li id="n1"><p>An endnote.</p></li></ol></section>`,
        "colophon.xhtml": `<section epub:type="colophon"><p>Set in type.</p></section>`,
      },
      nav: `<nav epub:type="toc"><ol><li><a href="one.xhtml">One</a></li><li><a href="notes.xhtml">Endnotes</a></li><li><a href="colophon.xhtml">Colophon</a></li></ol></nav>`,
    });
    expect(book.chapters).toContainEqual({
      title: "Endnotes",
      depth: 0,
      section: 3,
      paragraph: 0,
    });
  });
});
