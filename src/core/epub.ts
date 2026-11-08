// EPUB import (SPEC.md feature 2, ADR 0009): an EPUB file's bytes in; its
// title, author, sections and chapter list out. Each spine item is one
// section, so positions stored by section, paragraph and word (ADR 0008)
// don't depend on how the chapter list or the reading flow is worked out.

import { readContent, type Content } from "./epub/content.ts";
import {
  isXhtml,
  readPackage,
  rootfilePath,
  type Package,
} from "./epub/package.ts";
import { navEntries, ncxEntries, type TocEntry } from "./epub/toc.ts";
import { parseXml } from "./epub/xml.ts";
import { openZip, type Zip } from "./epub/zip.ts";
import { UNKNOWN_AUTHOR } from "./library.ts";
import type { Section } from "./text.ts";

/** An entry of a book's chapter list, pointing into its sections. */
export interface Chapter {
  title: string;
  /** 0 for the top level, 1 for the entries under one, and so on. */
  depth: number;
  /** Index of the section (spine item) it starts in. */
  section: number;
  /** Index of the paragraph it starts at, within the section. */
  paragraph: number;
}

/** An EPUB as the library stores it. */
export interface EpubBook {
  title: string;
  author: string;
  /** One per spine item, in spine order. */
  sections: Section[];
  chapters: Chapter[];
}

/**
 * Reads an EPUB file. `fileName` is the title when the metadata has none.
 * Rejects if the file isn't an EPUB this reader understands.
 */
export async function parseEpub(
  bytes: Uint8Array<ArrayBuffer>,
  fileName: string,
): Promise<EpubBook> {
  const zip = openZip(bytes);
  const opfPath = rootfilePath(await readXml(zip, "META-INF/container.xml"));
  const pack = readPackage(await readXml(zip, opfPath), opfPath);

  const contents: Content[] = [];
  for (const item of pack.spine) {
    contents.push(
      isXhtml(item.mediaType) && zip.has(item.path)
        ? readContent(await readXml(zip, item.path))
        : { paragraphs: [], anchors: new Map(), headings: [] },
    );
  }

  return {
    title: pack.title ?? titleFromFileName(fileName),
    author:
      pack.authors.length > 0
        ? new Intl.ListFormat("en", { type: "conjunction" }).format(
            pack.authors,
          )
        : UNKNOWN_AUTHOR,
    sections: contents.map(({ paragraphs }) => ({ paragraphs })),
    chapters: await chapters(zip, pack, contents),
  };
}

/**
 * The chapter list: the table of contents' entries that point into the
 * spine, or with none, every `h1` to `h6` heading in spine order.
 */
async function chapters(
  zip: Zip,
  pack: Package,
  contents: readonly Content[],
): Promise<Chapter[]> {
  const fromToc = (await tocEntries(zip, pack)).flatMap((entry) => {
    const section = pack.spine.findIndex(
      (item) => item.path === entry.target.path,
    );
    if (section === -1) return [];
    const { fragment } = entry.target;
    const paragraph =
      fragment === null ? 0 : (contents[section]!.anchors.get(fragment) ?? 0);
    return [{ title: entry.title, depth: entry.depth, section, paragraph }];
  });
  if (fromToc.length > 0) return fromToc;

  return contents.flatMap((content, section) =>
    content.headings.map((paragraph) => {
      const heading = content.paragraphs[paragraph]!;
      const title =
        heading.kind === "verse" ? heading.lines.join(" ") : heading.text;
      return {
        title: title.replace(/\s+/gu, " "),
        depth: 0,
        section,
        paragraph,
      };
    }),
  );
}

/** The navigation document's entries, or else the NCX's. */
async function tocEntries(zip: Zip, pack: Package): Promise<TocEntry[]> {
  if (pack.nav && zip.has(pack.nav)) {
    const entries = navEntries(await readXml(zip, pack.nav), pack.nav);
    if (entries.length > 0) return entries;
  }
  if (pack.ncx && zip.has(pack.ncx)) {
    return ncxEntries(await readXml(zip, pack.ncx), pack.ncx);
  }
  return [];
}

async function readXml(zip: Zip, path: string) {
  return parseXml(decodeText(await zip.read(path)));
}

/**
 * XML documents in an EPUB are UTF-8 or UTF-16 (EPUB 3.3's
 * `confreq-xml-enc`, linked in `epub/package.ts`). A document is read as
 * UTF-16 when it starts with a UTF-16 byte-order mark, and as UTF-8
 * otherwise; the decoder drops the mark.
 */
function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/** The file name without `.epub`. */
function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.epub$/i, "").trim() || fileName;
}
