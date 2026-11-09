// Where an EPUB's reading flow starts and ends, and what it skips (SPEC.md
// feature 2, issue #15, ADR 0011). The book is cut into parts at its
// chapter-list entries, its headings and where the markup changes role;
// each part is the author's text or publishing paperwork. The flow runs from
// the first of the author's parts to the last, skipping paperwork between.

import type { Part } from "../readingFlow.ts";
import type { Paragraph } from "../text.ts";
import type { Content, Role } from "./content.ts";

/** A chapter-list entry or EPUB 2 guide reference, in the spine's sections. */
interface Located {
  section: number;
  paragraph: number;
}

export interface Entry extends Located {
  title: string;
}

export interface GuideEntry extends Located {
  /** The guide reference's type, in lower case. */
  type: string;
}

/**
 * EPUB 2 guide types (OPF 2.0.1, section 2.6, linked in `package.ts`) that
 * mark paperwork, and the author's.
 */
const PAPERWORK_GUIDE = new Set([
  "cover",
  "title-page",
  "toc",
  "loi",
  "lot",
  "colophon",
  "copyright-page",
]);
const AUTHOR_GUIDE = new Set([
  "dedication",
  "epigraph",
  "foreword",
  "preface",
  "acknowledgements",
]);

/**
 * Section titles of paperwork, compared as letters and digits only. They
 * cover the Gutenberg fixtures' contents pages and P&P's list of
 * illustrations (tests/fixtures/epub/README.md).
 */
const PAPERWORK_TITLES = new Set([
  "contents",
  "tableofcontents",
  "listofillustrations",
  "illustrations",
  "listofplates",
]);

/** Letters and digits only, in lower case: "PRIDE. and PREJUDICE" → "prideandprejudice". */
function letters(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

type Class = Role | "pending" | "inherit";

interface Piece {
  /** Index of its first paragraph in the book's flat list. */
  from: number;
  title: string | null;
  role: Role | null;
  /** True when every paragraph in it is a heading. */
  headingOnly: boolean;
}

/**
 * The book's parts (ADR 0011), from each spine section's content, the
 * chapter list's entries and the EPUB 2 guide. Returns no parts when no
 * part is the author's, so the whole book reads.
 *
 * - The markup decides first: EPUB 3 semantics and Gutenberg's header and
 *   footer (`Content.roles`), then the guide.
 * - Then titles: a contents page or list of illustrations anywhere, and,
 *   before the author's first part, a part titled with the book's title.
 * - A part of headings only belongs with the part after it (Alice's
 *   "THE MILLENNIUM FULCRUM EDITION 3.0" before its contents), or with the
 *   one before when the markup marks the one after. A part with no title
 *   continues the one before it.
 */
export function findParts(
  bookTitle: string | null,
  contents: readonly Content[],
  entries: readonly Entry[],
  guide: readonly GuideEntry[],
): Part[] {
  const sections: number[] = [];
  const paragraphs: number[] = [];
  const roles: (Role | null)[] = [];
  const headings: boolean[] = [];
  const texts: Paragraph[] = [];
  contents.forEach((content, s) => {
    const guideRole = guideRoles(guide, s);
    const headingSet = new Set(content.headings);
    content.paragraphs.forEach((paragraph, p) => {
      sections.push(s);
      paragraphs.push(p);
      roles.push(content.roles[p] ?? guideRole(p));
      headings.push(headingSet.has(p));
      texts.push(paragraph);
    });
  });

  const entryTitles = new Map<string, string>();
  for (const entry of entries) {
    const key = `${entry.section}:${entry.paragraph}`;
    if (!entryTitles.has(key)) entryTitles.set(key, entry.title);
  }

  const pieces: Piece[] = [];
  for (let i = 0; i < texts.length; i++) {
    const entry = entryTitles.get(`${sections[i]}:${paragraphs[i]}`);
    const heading =
      headings[i]! &&
      !(i > 0 && headings[i - 1] && sections[i - 1] === sections[i]);
    const last = pieces.at(-1);
    if (!last || entry !== undefined || heading || roles[i] !== last.role) {
      pieces.push({
        from: i,
        title: entry ?? (headings[i] ? paragraphText(texts[i]!) : null),
        role: roles[i]!,
        headingOnly: headings[i]!,
      });
    } else if (!headings[i]) {
      last.headingOnly = false;
    }
  }

  // A book whose text sits under a heading with its own title, as a short
  // story's may, keeps that text: the title rule gives way.
  let classes = classify(pieces, bookTitle);
  if (!classes.includes("author")) classes = classify(pieces, null);
  const first = classes.indexOf("author");
  const last = classes.lastIndexOf("author");
  if (first === -1) return [];

  const parts: Part[] = [];
  pieces.forEach((piece, k) => {
    const skipped = k < first || k > last || classes[k] !== "author";
    if (parts.at(-1)?.skipped === skipped) return;
    parts.push({
      section: sections[piece.from]!,
      paragraph: paragraphs[piece.from]!,
      skipped,
    });
  });
  return parts;
}

/** The role the guide gives section `s`'s paragraphs, from where it points on. */
function guideRoles(
  guide: readonly GuideEntry[],
  s: number,
): (p: number) => Role | null {
  const here = guide
    .filter((g) => g.section === s)
    .flatMap((g): { from: number; role: Role }[] => {
      if (PAPERWORK_GUIDE.has(g.type))
        return [{ from: g.paragraph, role: "paperwork" }];
      if (AUTHOR_GUIDE.has(g.type))
        return [{ from: g.paragraph, role: "author" }];
      return [];
    })
    .sort((a, b) => a.from - b.from);
  return (p) => here.findLast((g) => g.from <= p)?.role ?? null;
}

function classify(pieces: readonly Piece[], bookTitle: string | null): Role[] {
  const title = bookTitle ? letters(bookTitle) : "";
  let seenAuthor = false;
  const classes: Class[] = pieces.map((piece) => {
    const name = piece.title === null ? null : letters(piece.title);
    let found: Class;
    if (piece.role) found = piece.role;
    else if (name !== null && PAPERWORK_TITLES.has(name)) found = "paperwork";
    else if (!seenAuthor && name && title && name.includes(title)) {
      found = "paperwork";
    } else if (piece.headingOnly) found = "pending";
    else if (name === null) found = "inherit";
    else found = "author";
    if (found === "author") seenAuthor = true;
    return found;
  });
  // An untitled part continues the one before it.
  for (let k = 0; k < classes.length; k++) {
    if (classes[k] === "inherit")
      classes[k] = k > 0 ? classes[k - 1]! : "author";
  }
  // Headings belong with what follows them, unless the markup marks what
  // follows, which then starts after them: Alice's "THE END" comes before
  // Gutenberg's footer.
  for (let k = classes.length - 1; k >= 0; k--) {
    if (classes[k] !== "pending") continue;
    const next = classes[k + 1];
    if ((next === "author" || next === "paperwork") && !pieces[k + 1]!.role) {
      classes[k] = next;
    } else {
      const before = classes.slice(0, k).findLast((c) => c !== "pending");
      classes[k] = before === "paperwork" ? "paperwork" : "author";
    }
  }
  return classes.map((c) => (c === "paperwork" ? "paperwork" : "author"));
}

function paragraphText(paragraph: Paragraph): string {
  return paragraph.kind === "verse"
    ? paragraph.lines.join(" ")
    : paragraph.text;
}
