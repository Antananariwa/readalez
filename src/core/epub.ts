// EPUB import (SPEC.md feature 2, ADR 0009): an EPUB file's bytes in; its
// title, author, sections, chapter list and reading flow out. Each spine
// item is one section, so positions stored by section, paragraph and word
// (ADR 0008) don't depend on how the chapter list or the reading flow is
// worked out. The notes follow in one section of their own (ADR 0011).

import { emptyContent, readContent, type Content } from "./epub/content.ts";
import { findParts, type GuideEntry } from "./epub/flow.ts";
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
import { titleFrom } from "./paste.ts";
import type { Part, Place } from "./readingFlow.ts";
import type { Paragraph, Section } from "./text.ts";

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
  /** One per spine item, in spine order, then the notes if there are any. */
  sections: Section[];
  chapters: Chapter[];
  /** The reading flow (`src/core/readingFlow.ts`); empty if it's all of it. */
  parts: Part[];
}

/** The chapter-list entry for the section of notes. */
export const NOTES_TITLE = "Notes";

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
        : emptyContent(),
    );
  }

  const title = pack.title ?? titleFromFileName(fileName);
  const sections: Section[] = contents.map(({ paragraphs }) => ({
    paragraphs,
  }));
  const notes = gatherNotes(contents);
  const locate = locator(pack, contents, notes);
  const listed = await chapters(zip, pack, contents, locate);
  const inSpine = listed.filter((c) => c.section < contents.length);
  const guide = pack.guide.flatMap((reference): GuideEntry[] => {
    const place = locate(reference.target.path, reference.target.fragment);
    return place && place.section < contents.length
      ? [{ ...place, type: reference.type }]
      : [];
  });
  const parts = findParts(title, contents, inSpine, guide);
  if (notes.paragraphs.length > 0) {
    if (parts.length === 0)
      parts.push({ section: 0, paragraph: 0, skipped: false });
    parts.push({ section: sections.length, paragraph: 0, skipped: true });
    sections.push({ paragraphs: notes.paragraphs });
  }

  return {
    title,
    author:
      pack.authors.length > 0
        ? new Intl.ListFormat("en", { type: "conjunction" }).format(
            pack.authors,
          )
        : UNKNOWN_AUTHOR,
    sections,
    chapters: withParts(
      listed,
      parts,
      sections,
      notes.paragraphs.length > 0 ? contents.length : null,
    ),
    parts,
  };
}

/** Every content document's notes in one list, with where each starts. */
function gatherNotes(contents: readonly Content[]): {
  paragraphs: Paragraph[];
  offsets: number[];
} {
  const paragraphs: Paragraph[] = [];
  const offsets = contents.map((content) => {
    const offset = paragraphs.length;
    paragraphs.push(...content.notes);
    return offset;
  });
  return { paragraphs, offsets };
}

/**
 * Finds a link's place: a spine document, and the paragraph at or after the
 * element its `#fragment` names, in the notes' section if it's in a note.
 * Null for a document outside the spine.
 */
function locator(
  pack: Package,
  contents: readonly Content[],
  notes: { offsets: number[] },
): (path: string, fragment: string | null) => Place | null {
  return (path, fragment) => {
    const section = pack.spine.findIndex((item) => item.path === path);
    if (section === -1) return null;
    const content = contents[section]!;
    if (fragment === null) {
      // A document of notes only, such as Standard Ebooks' endnotes, has
      // moved to the notes' section.
      return content.paragraphs.length === 0 && content.notes.length > 0
        ? { section: contents.length, paragraph: notes.offsets[section]! }
        : { section, paragraph: 0 };
    }
    const paragraph = content.anchors.get(fragment);
    if (paragraph !== undefined) return { section, paragraph };
    const note = content.noteAnchors.get(fragment);
    if (note !== undefined) {
      return {
        section: contents.length,
        paragraph: notes.offsets[section]! + note,
      };
    }
    return { section, paragraph: 0 };
  };
}

/**
 * The chapter list with an entry for each part that doesn't start at one,
 * titled with its first paragraph (cut as a pasted title is), so everything
 * skipped can be reached (SPEC.md feature 2). The notes' section is titled
 * `NOTES_TITLE`.
 */
function withParts(
  chapters: readonly Chapter[],
  parts: readonly Part[],
  sections: readonly Section[],
  notesSection: number | null,
): Chapter[] {
  const result = [...chapters];
  const at = (place: Place) =>
    result.some(
      (c) => c.section === place.section && c.paragraph === place.paragraph,
    );
  for (const part of parts) {
    if (at(part)) continue;
    const paragraph = sections[part.section]?.paragraphs[part.paragraph];
    if (!paragraph) continue;
    const title =
      part.section === notesSection && part.paragraph === 0
        ? NOTES_TITLE
        : titleFrom(
            paragraph.kind === "verse"
              ? paragraph.lines.join(" ")
              : paragraph.text,
          );
    const entry = {
      title,
      depth: 0,
      section: part.section,
      paragraph: part.paragraph,
    };
    const after = result.findIndex(
      (c) =>
        c.section > part.section ||
        (c.section === part.section && c.paragraph > part.paragraph),
    );
    result.splice(after === -1 ? result.length : after, 0, entry);
  }
  return result;
}

/**
 * The chapter list: the table of contents' entries that point into the
 * spine, or with none, every `h1` to `h6` heading in spine order.
 */
async function chapters(
  zip: Zip,
  pack: Package,
  contents: readonly Content[],
  locate: (path: string, fragment: string | null) => Place | null,
): Promise<Chapter[]> {
  const fromToc = (await tocEntries(zip, pack)).flatMap((entry) => {
    const place = locate(entry.target.path, entry.target.fragment);
    return place ? [{ title: entry.title, depth: entry.depth, ...place }] : [];
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
