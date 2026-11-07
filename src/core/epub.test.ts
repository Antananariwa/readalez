import { describe, expect, it } from "vitest";
import { parseEpub } from "./epub.ts";
import { storedZip, testEpub, xhtml } from "./epub/testZip.ts";
import { UNKNOWN_AUTHOR } from "./library.ts";

const CHAPTERS = {
  "one.xhtml": "<h1>Chapter One</h1><p>It was a dark night.</p>",
  "two.xhtml":
    '<h1>Chapter Two</h1><p>Morning came.</p><h2 id="part">A Part</h2><p>Then noon.</p>',
};

describe("parseEpub", () => {
  it("takes the title and author from the metadata", async () => {
    const book = await parseEpub(
      testEpub({
        metadata: `
          <dc:title id="t">  A Christmas
            Carol </dc:title>
          <meta refines="#t" property="title-type">main</meta>
          <dc:creator id="a">Charles Dickens</dc:creator>
          <meta refines="#a" property="role" scheme="marc:relators">aut</meta>
          <dc:contributor id="c">John Leech</dc:contributor>`,
        documents: CHAPTERS,
      }),
      "carol.epub",
    );
    expect(book.title).toBe("A Christmas Carol");
    expect(book.author).toBe("Charles Dickens");
  });

  it("takes the main title when there are several", async () => {
    const book = await parseEpub(
      testEpub({
        metadata: `
          <dc:title id="s">A Ghost Story of Christmas</dc:title>
          <meta refines="#s" property="title-type">subtitle</meta>
          <dc:title id="m">A Christmas Carol</dc:title>
          <meta refines="#m" property="title-type">main</meta>`,
        documents: CHAPTERS,
      }),
      "carol.epub",
    );
    expect(book.title).toBe("A Christmas Carol");
  });

  it("lists every author, leaving out creators with other roles", async () => {
    const epub3 = await parseEpub(
      testEpub({
        metadata: `
          <dc:creator id="a">William Wordsworth</dc:creator>
          <dc:creator id="b">Samuel Taylor Coleridge</dc:creator>
          <meta refines="#b" property="role">aut</meta>
          <dc:creator id="c">An Illustrator</dc:creator>
          <meta refines="#c" property="role">ill</meta>`,
        documents: CHAPTERS,
      }),
      "x.epub",
    );
    expect(epub3.author).toBe("William Wordsworth and Samuel Taylor Coleridge");

    const epub2 = await parseEpub(
      testEpub({
        version: "2.0",
        metadata: `
          <dc:creator opf:role="aut">Robert Louis Stevenson</dc:creator>
          <dc:creator opf:role="trl">A Translator</dc:creator>
          <dc:creator>Lloyd Osbourne</dc:creator>
          <dc:creator opf:role="aut">Fanny Van de Grift Stevenson</dc:creator>`,
        documents: CHAPTERS,
      }),
      "x.epub",
    );
    expect(epub2.author).toBe(
      "Robert Louis Stevenson, Lloyd Osbourne, and Fanny Van de Grift Stevenson",
    );
  });

  it("falls back to the file name and Unknown author", async () => {
    const book = await parseEpub(
      testEpub({ metadata: "<dc:title>  </dc:title>", documents: CHAPTERS }),
      "The Story of the Door.EPUB",
    );
    expect(book.title).toBe("The Story of the Door");
    expect(book.author).toBe(UNKNOWN_AUTHOR);
  });

  it("makes each spine item a section, in spine order", async () => {
    const book = await parseEpub(testEpub({ documents: CHAPTERS }), "x.epub");
    expect(book.sections).toEqual([
      {
        paragraphs: [
          { kind: "heading", text: "Chapter One" },
          { kind: "prose", text: "It was a dark night." },
        ],
      },
      {
        paragraphs: [
          { kind: "heading", text: "Chapter Two" },
          { kind: "prose", text: "Morning came." },
          { kind: "heading", text: "A Part" },
          { kind: "prose", text: "Then noon." },
        ],
      },
    ]);
  });

  it("takes the chapter list from the navigation document, with fragments and depths", async () => {
    const book = await parseEpub(
      testEpub({
        documents: CHAPTERS,
        nav: `
          <nav epub:type="landmarks"><ol><li><a href="two.xhtml">Not this</a></li></ol></nav>
          <nav epub:type="toc"><ol>
            <li><a href="one.xhtml">One</a></li>
            <li><span>Part without a link</span><ol>
              <li><a href="two.xhtml">Two</a><ol><li><a href="two.xhtml#part">The <i>Part</i></a></li></ol></li>
            </ol></li>
            <li><a href="https://example.com/">Elsewhere</a></li>
            <li><a href="missing.xhtml">Not in the spine</a></li>
          </ol></nav>`,
      }),
      "x.epub",
    );
    expect(book.chapters).toEqual([
      { title: "One", depth: 0, section: 0, paragraph: 0 },
      { title: "Two", depth: 1, section: 1, paragraph: 0 },
      { title: "The Part", depth: 2, section: 1, paragraph: 2 },
    ]);
  });

  it("takes the chapter list from an EPUB 2 NCX", async () => {
    const book = await parseEpub(
      testEpub({
        version: "2.0",
        documents: CHAPTERS,
        ncx: `
          <navPoint id="n1" playOrder="1"><navLabel><text>One</text></navLabel><content src="one.xhtml"/></navPoint>
          <navPoint id="n2" playOrder="2"><navLabel><text>Two</text></navLabel><content src="two.xhtml"/>
            <navPoint id="n3" playOrder="3"><navLabel><text>A Part</text></navLabel><content src="two.xhtml#part"/></navPoint>
          </navPoint>`,
      }),
      "x.epub",
    );
    expect(book.chapters).toEqual([
      { title: "One", depth: 0, section: 0, paragraph: 0 },
      { title: "Two", depth: 0, section: 1, paragraph: 0 },
      { title: "A Part", depth: 1, section: 1, paragraph: 2 },
    ]);
  });

  it("takes the chapter list from the headings when there's no table of contents", async () => {
    const book = await parseEpub(testEpub({ documents: CHAPTERS }), "x.epub");
    expect(book.chapters).toEqual([
      { title: "Chapter One", depth: 0, section: 0, paragraph: 0 },
      { title: "Chapter Two", depth: 0, section: 1, paragraph: 0 },
      { title: "A Part", depth: 0, section: 1, paragraph: 2 },
    ]);
  });

  it("takes the chapter list from the headings when the table of contents is empty", async () => {
    const book = await parseEpub(
      testEpub({
        documents: CHAPTERS,
        nav: '<nav epub:type="toc"><ol></ol></nav>',
      }),
      "x.epub",
    );
    expect(book.chapters.map((c) => c.title)).toEqual([
      "Chapter One",
      "Chapter Two",
      "A Part",
    ]);
  });

  it("keeps a section for each spine item it can't read, so later sections keep their indices", async () => {
    const opf = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata/>
<manifest>
  <item id="cover" href="images/cover.svg" media-type="image/svg+xml"/>
  <item id="gone" href="Text/gone.xhtml" media-type="application/xhtml+xml"/>
  <item id="ch" href="Text/Chapter%201.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine><itemref idref="cover"/><itemref idref="gone" linear="no"/><itemref idref="nowhere"/><itemref idref="ch"/></spine>
</package>`;
    const book = await parseEpub(
      storedZip({
        mimetype: "application/epub+zip",
        "META-INF/container.xml":
          '<container><rootfiles><rootfile full-path="pkg/book.opf"/></rootfiles></container>',
        "pkg/book.opf": opf,
        "pkg/images/cover.svg": "<svg/>",
        "pkg/Text/Chapter 1.xhtml": xhtml("<p>Text.</p>"),
      }),
      "x.epub",
    );
    expect(book.sections).toEqual([
      { paragraphs: [] },
      { paragraphs: [] },
      { paragraphs: [] },
      { paragraphs: [{ kind: "prose", text: "Text." }] },
    ]);
  });

  it("reads UTF-16 documents", async () => {
    const text = xhtml("<p>Żółć</p>");
    const utf16 = new Uint8Array(2 + text.length * 2);
    const view = new DataView(utf16.buffer);
    view.setUint16(0, 0xfeff, true);
    for (let i = 0; i < text.length; i++) {
      view.setUint16(2 + i * 2, text.charCodeAt(i), true);
    }
    const book = await parseEpub(
      storedZip({
        "META-INF/container.xml":
          '<container><rootfiles><rootfile full-path="a.opf"/></rootfiles></container>',
        "a.opf":
          '<package version="3.0"><manifest><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="a"/></spine></package>',
        "a.xhtml": utf16,
      }),
      "x.epub",
    );
    expect(book.sections[0]!.paragraphs).toEqual([
      { kind: "prose", text: "Żółć" },
    ]);
  });

  it.each([
    ["not a ZIP file", new Uint8Array([1, 2, 3])],
    ["no container", storedZip({ mimetype: "application/epub+zip" })],
    [
      "no package",
      storedZip({
        "META-INF/container.xml":
          '<container><rootfiles><rootfile full-path="a.opf"/></rootfiles></container>',
      }),
    ],
  ])("rejects a file with %s", async (_, bytes) => {
    await expect(parseEpub(bytes, "x.epub")).rejects.toThrow();
  });
});
