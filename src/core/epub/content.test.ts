import { describe, expect, it } from "vitest";
import { splitText, wordText } from "../text.ts";
import { readContent } from "./content.ts";
import { xhtml } from "./testZip.ts";
import { parseXml } from "./xml.ts";

const read = (body: string) => readContent(parseXml(xhtml(body)));
const paragraphs = (body: string) => read(body).paragraphs;

describe("readContent", () => {
  it("makes headings, paragraphs, block quotes, list items and table rows each a paragraph, in order", () => {
    expect(
      paragraphs(`
        <section>
          <h2>Chapter <span>I</span></h2>
          <p>First <em>paragraph</em>.</p>
          <blockquote>A quotation.</blockquote>
          <blockquote><p>Quoted one.</p><p>Quoted two.</p></blockquote>
          <ul><li>Item one</li><li>Item <b>two</b><ol><li>Nested</li></ol></li></ul>
          <table><tr><th>Name</th><td>Scrooge</td></tr><tr><td>Partner</td><td>Marley</td></tr></table>
          <div>Loose text <p>inner</p> after</div>
        </section>`),
    ).toEqual([
      { kind: "heading", text: "Chapter I" },
      { kind: "prose", text: "First paragraph." },
      { kind: "prose", text: "A quotation." },
      { kind: "prose", text: "Quoted one." },
      { kind: "prose", text: "Quoted two." },
      { kind: "prose", text: "Item one" },
      { kind: "prose", text: "Item two" },
      { kind: "prose", text: "Nested" },
      { kind: "prose", text: "Name Scrooge" },
      { kind: "prose", text: "Partner Marley" },
      { kind: "prose", text: "Loose text" },
      { kind: "prose", text: "inner" },
      { kind: "prose", text: "after" },
    ]);
  });

  it("reads an hgroup as headings, of which only h1 to h6 start chapters", () => {
    const content = read(
      "<hgroup><h2>Stave I</h2><p>Marley’s Ghost</p></hgroup><p>Marley was dead.</p>",
    );
    expect(content.paragraphs).toEqual([
      { kind: "heading", text: "Stave I" },
      { kind: "heading", text: "Marley’s Ghost" },
      { kind: "prose", text: "Marley was dead." },
    ]);
    expect(content.headings).toEqual([0]);
  });

  it("drops images, with their alt text and captions", () => {
    expect(
      paragraphs(`
        <p>Before.</p>
        <img alt="A portrait of Scrooge" src="a.jpg"/>
        <figure><img alt="Marley’s face" src="b.jpg"/><figcaption>Marley’s Ghost</figcaption></figure>
        <div class="figcenter"><img src="c.jpg" alt="Fezziwig"/><p class="caption">Mr. Fezziwig’s Ball</p></div>
        <p>In <span class="caption">a caption</span>the text <svg><text>drawn</text></svg>goes on.</p>
        <section><img src="frontispiece.jpg" alt="Frontispiece"/></section>`),
    ).toEqual([
      { kind: "prose", text: "Before." },
      { kind: "prose", text: "In the text goes on." },
    ]);
  });

  it("removes soft hyphens and zero-width characters, and reads no-break spaces as spaces", () => {
    expect(
      paragraphs(
        "<p>ghost\u00adly in\u200bvisible zero\u200c\u200dwidth word\u2060—\u2060joiner \ufeffmark Mr.\u00a0Scrooge 1\u2007000 a\u202fb</p>",
      ),
    ).toEqual([
      {
        kind: "prose",
        text: "ghostly invisible zerowidth word—joiner mark Mr. Scrooge 1 000 a b",
      },
    ]);
  });

  it("collapses whitespace and reads a line break as one", () => {
    expect(
      paragraphs(
        "<p>\n\t\tA Christmas Carol<br/>\n\t\twas published\n  in 1843</p>",
      ),
    ).toEqual([
      { kind: "prose", text: "A Christmas Carol\nwas published in 1843" },
    ]);
  });

  it("reads Standard Ebooks verse as lines, a paragraph per stanza", () => {
    expect(
      paragraphs(`
        <blockquote epub:type="z3998:song">
          <p>
            <span>“God bless you, merry gentleman,</span>
            <br/>
            <span>May nothing you dismay!”</span>
          </p>
          <p><span>Second stanza</span><br/><span class="i1">indented line</span></p>
        </blockquote>
        <p>Scrooge seized the ruler.</p>`),
    ).toEqual([
      {
        kind: "verse",
        lines: ["“God bless you, merry gentleman,", "May nothing you dismay!”"],
      },
      { kind: "verse", lines: ["Second stanza", "indented line"] },
      { kind: "prose", text: "Scrooge seized the ruler." },
    ]);
  });

  it("reads Gutenberg verse, with lines as line breaks or as blocks", () => {
    expect(
      paragraphs(`
        <div class="poem">
          <h3>The Poem</h3>
          <div class="stanza">
            <span class="i0">It is an ancient Mariner,<br/></span>
            <span class="i1">And he stoppeth one of three.<br/></span>
          </div>
          <div class="stanza">
            <div class="i0">By thy long grey beard</div>
            <div class="i1">and glittering eye,</div>
          </div>
        </div>
        <p class="poem">Line one<br/>Line two</p>`),
    ).toEqual([
      { kind: "heading", text: "The Poem" },
      {
        kind: "verse",
        lines: ["It is an ancient Mariner,", "And he stoppeth one of three."],
      },
      {
        kind: "verse",
        lines: ["By thy long grey beard", "and glittering eye,"],
      },
      { kind: "verse", lines: ["Line one", "Line two"] },
    ]);
  });

  it("starts a new stanza at an empty line in verse, as Gutenberg's Alice marks them", () => {
    // As in the Alice fixture: <br/> ends a line, and <br/><br/> a stanza.
    expect(
      paragraphs(`
        <p class="poem">
          “How doth the little crocodile<br/>
              Improve his shining tail,<br/>
          <br/>
          “How cheerfully he seems to grin,<br/>
              How neatly spread his claws,
        </p>
        <p>Not verse<br/><br/>here.</p>`),
    ).toEqual([
      {
        kind: "verse",
        lines: ["“How doth the little crocodile", "Improve his shining tail,"],
      },
      {
        kind: "verse",
        lines: [
          "“How cheerfully he seems to grin,",
          "How neatly spread his claws,",
        ],
      },
      { kind: "prose", text: "Not verse\nhere." },
    ]);
  });

  it("ends each verse line with a line-break pause", () => {
    const words = splitText([
      {
        paragraphs: paragraphs(
          '<div epub:type="z3998:poem"><p>Old Father William<br/>the young man said</p></div>',
        ),
      },
    ]);
    expect(words.map((w) => [wordText(w), w.end])).toEqual([
      ["Old", null],
      ["Father", null],
      ["William", "line"],
      ["the", null],
      ["young", null],
      ["man", null],
      ["said", "paragraph"],
    ]);
  });

  it("maps each id to the paragraph at or after it", () => {
    const content = read(`
      <section id="start">
        <h2 id="title">Title</h2>
        <p>One <a id="inline"/>still one.</p>
        <span id="between"/>
        <p>Two</p>
        <p id="empty"></p>
        <a id="end"/>
      </section>`);
    expect(Object.fromEntries(content.anchors)).toEqual({
      start: 0,
      title: 0,
      inline: 1,
      between: 2,
      empty: 2,
      end: 2,
    });
  });

  it("leaves a document with no text with no paragraphs", () => {
    expect(
      paragraphs(
        '<section epub:type="cover"><img src="cover.jpg" alt="Cover"/></section>',
      ),
    ).toEqual([]);
  });
});

describe("readContent: notes and markers (#15)", () => {
  it("drops links marked as note references, and links that read as markers", () => {
    expect(
      paragraphs(`
        <p>One<a epub:type="noteref" href="#n1">1</a> two<a role="doc-noteref" href="n.xhtml#n2">2</a>.</p>
        <p>Three<a class="fnanchor" href="#f3">[3]</a>, four<a href="#f4">[4]</a> and five<sup><a href="#f5">5</a></sup>.</p>
        <p>Six<a href="#f6">*</a> seven<a href="#f7">†</a> eight<a href="#f8">²</a> nine<a href="#f9">(a)</a>.</p>`),
    ).toEqual([
      { kind: "prose", text: "One two." },
      { kind: "prose", text: "Three, four and five." },
      { kind: "prose", text: "Six seven eight nine." },
    ]);
  });

  it("keeps other links, bare numbers and links to other sites", () => {
    expect(
      paragraphs(`
        <p>See chapter <a href="#c5">5</a>, <a href="#c1">the start</a> and <a href="https://example.org/">[1]</a>.</p>`),
    ).toEqual([{ kind: "prose", text: "See chapter 5, the start and [1]." }]);
  });

  it("keeps the notes apart, with their own anchors, labels included", () => {
    const content = read(`
      <p id="p1">Text<a class="fnanchor" href="#Footnote_1">[1]</a> goes on.</p>
      <div class="footnote"><p><a id="Footnote_1" href="#FNanchor_1" class="label">[1]</a> A note.</p></div>
      <p>More text.</p>
      <aside epub:type="footnote" id="fn2"><p>Second note.</p></aside>
      <section epub:type="endnotes" role="doc-endnotes">
        <h2>Notes</h2>
        <ol><li id="en1"><p>An endnote.</p></li></ol>
      </section>`);
    expect(content.paragraphs).toEqual([
      { kind: "prose", text: "Text goes on." },
      { kind: "prose", text: "More text." },
    ]);
    expect(content.notes).toEqual([
      { kind: "prose", text: "[1] A note." },
      { kind: "prose", text: "Second note." },
      { kind: "heading", text: "Notes" },
      { kind: "prose", text: "An endnote." },
    ]);
    expect(content.headings).toEqual([]);
    expect(content.anchors.get("p1")).toBe(0);
    expect(content.noteAnchors.get("Footnote_1")).toBe(0);
    expect(content.noteAnchors.get("fn2")).toBe(1);
    expect(content.noteAnchors.get("en1")).toBe(3);
  });

  it("goes on with the text after a note in the same block", () => {
    expect(
      paragraphs(
        `<div>Before <aside epub:type="footnote"><p>Note.</p></aside> after.</div>`,
      ),
    ).toEqual([
      { kind: "prose", text: "Before" },
      { kind: "prose", text: "after." },
    ]);
  });
});

describe("readContent: roles (#15)", () => {
  it("marks paperwork and the author's text from EPUB 3 semantics, the nearest winning", () => {
    const content = read(`
      <section epub:type="titlepage"><h1>A Title</h1></section>
      <section epub:type="preface"><p>A preface.</p></section>
      <section epub:type="frontmatter"><p>Unmarked.</p></section>
      <section role="doc-toc"><p>Contents</p></section>
      <section epub:type="bodymatter"><section epub:type="colophon"><p>Set in type.</p></section><p>Back in the body.</p></section>`);
    expect(content.roles).toEqual([
      "paperwork",
      "author",
      null,
      "paperwork",
      "paperwork",
      "author",
    ]);
  });

  it("marks Gutenberg's header and footer as paperwork", () => {
    const content = read(`
      <header class="pg-boilerplate pgheader" id="pg-header"><h2>The Project Gutenberg eBook of X</h2><div id="pg-start-separator"><span>*** START OF THE PROJECT GUTENBERG EBOOK X ***</span></div></header>
      <h1>X</h1>
      <div class="pg-boilerplate" id="pg-footer"><div id="pg-end-separator">*** END ***</div><p>License.</p></div>`);
    expect(content.roles).toEqual([
      "paperwork",
      "paperwork",
      null,
      "paperwork",
      "paperwork",
    ]);
  });
});
