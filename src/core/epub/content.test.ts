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
