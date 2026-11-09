// An EPUB content document (SPEC.md feature 2): XHTML in, the text model's
// paragraphs out (`src/core/text.ts`). Headings, paragraphs, block quotes,
// list items and table rows each become a paragraph, and verse keeps its
// lines. Images go, with their alt text and captions. Notes are kept apart
// and note markers are dropped (issue #15), and each paragraph carries what
// the markup says it is (`Role`), for finding the reading flow (`flow.ts`).

import type { Paragraph } from "../text.ts";
import {
  childrenNamed,
  collapseWhitespace,
  elements,
  localName,
  textContent,
  tokens,
  type XmlElement,
} from "./xml.ts";

/**
 * What the markup says a paragraph is: publishing paperwork (a cover, title
 * page, contents or license) or the author's text. Null when it says neither.
 */
export type Role = "paperwork" | "author";

/** A content document as paragraphs, with where its ids and headings are. */
export interface Content {
  paragraphs: Paragraph[];
  /** Each paragraph's role, in the same order. */
  roles: (Role | null)[];
  /**
   * For each element id, the index of the paragraph at or after it, so a
   * link with a `#fragment` can find its place.
   */
  anchors: Map<string, number>;
  /** Indices of the paragraphs that came from `h1` to `h6`. */
  headings: number[];
  /** The notes' paragraphs, kept out of `paragraphs`. */
  notes: Paragraph[];
  /** For each element id inside a note, the index in `notes` at or after it. */
  noteAnchors: Map<string, number>;
}

/** An empty content document, for a spine item that isn't XHTML. */
export function emptyContent(): Content {
  return {
    paragraphs: [],
    roles: [],
    anchors: new Map(),
    headings: [],
    notes: [],
    noteAnchors: new Map(),
  };
}

/** Elements that start and end a paragraph. */
const BLOCKS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "body",
  "caption",
  "dd",
  "div",
  "dl",
  "dt",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "tfoot",
  "thead",
  "tr",
  "ul",
]);

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Table cells: each is set off by spaces, so a row reads as one paragraph. */
const CELLS = new Set(["td", "th"]);

/** Elements left out with everything in them. */
const DROPPED = new Set([
  "audio",
  "figcaption",
  "figure",
  "head",
  "img",
  "math",
  "object",
  "script",
  "style",
  "svg",
  "video",
]);

/**
 * Classes of image blocks and captions that aren't marked as `figure`.
 * Distributed Proofreaders, who prepare many of Gutenberg's books, use
 * these (not checked against their guidelines). The Pride and Prejudice
 * fixture, which they produced, has `figcenter`, `figleft` and `caption`
 * (tests/fixtures/epub/README.md).
 */
const DROPPED_CLASSES = new Set([
  "caption",
  "figcenter",
  "figleft",
  "figright",
]);

/**
 * Verse in EPUB 3's structural vocabulary (z3998), as Standard Ebooks marks
 * it, and in the classes Gutenberg's HTML uses.
 */
const VERSE_TYPES = new Set([
  "z3998:poem",
  "z3998:verse",
  "z3998:song",
  "z3998:hymn",
]);
const VERSE_CLASSES = new Set(["poem", "poetry", "verse", "stanza"]);

/**
 * Characters removed from the text: the soft hyphen and the zero-width
 * characters (space, non-joiner, joiner, word joiner, and the byte-order
 * mark, also called the zero-width no-break space).
 */
// An alternation, since a joiner inside a character class reads as joining
// its neighbours (oxlint no-misleading-character-class).
const REMOVED = /\u00ad|\u200b|\u200c|\u200d|\u2060|\ufeff/gu;

/**
 * No-break spaces (the no-break, figure and narrow no-break spaces) read as
 * plain spaces.
 */
const NO_BREAK_SPACES = /[\u00a0\u2007\u202f]/gu;

/** XML's whitespace characters. */
const XML_WHITESPACE = /[ \t\r\n]+/g;

/**
 * Paperwork in EPUB 3's structural semantics vocabulary (`epub:type`,
 * https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/wg-notes/ssv/index.html)
 * and in DPUB-ARIA's roles (`role`,
 * https://github.com/w3c/aria/blob/46d4e44fd29f76142f58308279ce6509a779b1e8/dpub-aria/index.html).
 * Standard Ebooks marks each document this way (tests/fixtures/epub/README.md).
 */
const PAPERWORK_TYPES = new Set([
  "cover",
  "titlepage",
  "halftitlepage",
  "copyright-page",
  "imprint",
  "toc",
  "loi",
  "lot",
  "colophon",
  "doc-cover",
  "doc-toc",
  "doc-colophon",
]);

/** The author's parts in the same vocabularies. */
const AUTHOR_TYPES = new Set([
  "bodymatter",
  "chapter",
  "part",
  "volume",
  "division",
  "preface",
  "foreword",
  "introduction",
  "prologue",
  "epilogue",
  "afterword",
  "conclusion",
  "dedication",
  "epigraph",
  "appendix",
  "acknowledgments",
  "doc-chapter",
  "doc-part",
  "doc-preface",
  "doc-foreword",
  "doc-introduction",
  "doc-prologue",
  "doc-epilogue",
  "doc-afterword",
  "doc-conclusion",
  "doc-dedication",
  "doc-epigraph",
  "doc-appendix",
  "doc-acknowledgments",
]);

/**
 * Gutenberg's header and footer, around the book's text, with its license:
 * `id="pg-header"` and `id="pg-footer"`, both with the class
 * `pg-boilerplate`, in all five Gutenberg fixtures
 * (tests/fixtures/epub/README.md).
 */
const GUTENBERG_IDS = new Set(["pg-header", "pg-footer"]);
const GUTENBERG_CLASS = "pg-boilerplate";

/** Notes, in the same vocabularies, and the classes Gutenberg's HTML uses. */
const NOTE_TYPES = new Set([
  "footnote",
  "footnotes",
  "endnote",
  "endnotes",
  "rearnote",
  "rearnotes",
  "note",
  "doc-footnote",
  "doc-endnotes",
]);
const NOTE_CLASSES = new Set(["footnote", "footnotes", "endnote", "endnotes"]);

/**
 * Note markers: links marked as such, or with Gutenberg's class `fnanchor`
 * (Distributed Proofreaders' convention, not checked against their
 * guidelines).
 */
const MARKER_TYPES = new Set(["noteref", "doc-noteref"]);
const MARKER_CLASSES = new Set(["fnanchor", "noteref", "footnote-ref"]);

/**
 * A link's whole text that reads as a note marker: a number, letter or
 * symbol in brackets ("[12]", "(a)", "[*]"), symbols ("*", "†") or
 * superscript digits ("¹²"). A bare number counts only in superscript
 * (`isMarker`), so a cross-reference such as "chapter 5" stays.
 */
const BRACKETED_MARKER =
  /^(?:\[(?:\d{1,4}|\p{L}|[*†‡§¶‖]+)\]|\((?:\d{1,4}|\p{L})\)|[*†‡§¶‖]+|[⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/u;
const NUMBER_MARKER = /^\d{1,4}$/u;

type Kind = Paragraph["kind"];

/** Reads a content document's `body` into paragraphs. */
export function readContent(document: XmlElement): Content {
  const body = childrenNamed(document, "body")[0] ?? document;
  const builder = new Builder();
  builder.visit(body, {
    kind: "prose",
    verseDepth: null,
    chapter: false,
    role: null,
    note: false,
    superscript: false,
  });
  builder.flush();
  return builder.content();
}

interface Context {
  /** The kind a paragraph started here gets. */
  kind: Kind;
  /**
   * In verse, how many blocks deep below the verse container: at 0 a block
   * is a stanza, deeper ones are lines. Null outside verse.
   */
  verseDepth: number | null;
  /** True inside `h1` to `h6`, whose paragraphs start chapters. */
  chapter: boolean;
  /** The role of the nearest element that has one. */
  role: Role | null;
  /** True inside a note. */
  note: boolean;
  /** True inside `sup`. */
  superscript: boolean;
}

class Builder {
  private readonly paragraphs: Paragraph[] = [];
  private readonly roles: (Role | null)[] = [];
  private readonly anchors = new Map<string, number>();
  private readonly headings: number[] = [];
  private readonly notes: Paragraph[] = [];
  private readonly noteAnchors = new Map<string, number>();
  /** The open paragraph's finished lines, and the line being written. */
  private lines: string[] = [];
  private line = "";
  private kind: Kind = "prose";
  private chapter = false;
  private role: Role | null = null;
  /** True while the open paragraph belongs to a note. */
  private inNote = false;

  visit(element: XmlElement, outer: Context): void {
    const name = localName(element.name);
    if (DROPPED.has(name)) return;
    if (tokens(element, "class").some((c) => DROPPED_CLASSES.has(c))) return;
    if (!outer.note && isMarker(element, name, outer)) return;
    const context = this.marked(element, name, outer);
    if (name === "br") {
      // In verse, an empty line between lines ends the stanza, as in
      // Gutenberg's `<p class="poem">` (tests/fixtures/epub/README.md).
      if (context.verseDepth !== null && this.line.trim() === "") {
        if (!this.isEmpty()) this.flush();
      } else {
        this.lineBreak();
      }
      return;
    }

    const { inner, end } = this.enter(element, name, context);
    // After `enter`, which may have ended the paragraph before this one.
    const id = element.attributes.get("id");
    if (id !== undefined) {
      const [anchors, list] = context.note
        ? [this.noteAnchors, this.notes]
        : [this.anchors, this.paragraphs];
      if (!anchors.has(id)) anchors.set(id, list.length);
    }
    if (CELLS.has(name)) this.write(" ");
    for (const child of element.children) {
      if (typeof child === "string") this.write(child, inner);
      else this.visit(child, inner);
    }
    if (CELLS.has(name)) this.write(" ");
    if (end === "paragraph") this.flush();
    else if (end === "line") this.lineBreak();
    if (context.note !== outer.note) {
      this.flush();
      this.inNote = outer.note;
    }
  }

  /**
   * The context inside `element` as far as its role, notes and superscript
   * go. Entering or leaving a note ends the open paragraph, so no paragraph
   * mixes a note with the text around it.
   */
  private marked(element: XmlElement, name: string, outer: Context): Context {
    const types = [...tokens(element, "epub:type"), ...tokens(element, "role")];
    const classes = tokens(element, "class");
    const note =
      outer.note ||
      types.some((t) => NOTE_TYPES.has(t)) ||
      classes.some((c) => NOTE_CLASSES.has(c));
    let role = outer.role;
    if (
      types.some((t) => PAPERWORK_TYPES.has(t)) ||
      GUTENBERG_IDS.has(element.attributes.get("id") ?? "") ||
      classes.includes(GUTENBERG_CLASS)
    ) {
      role = "paperwork";
    } else if (types.some((t) => AUTHOR_TYPES.has(t))) {
      role = "author";
    }
    if (note !== outer.note) {
      this.flush();
      this.inNote = note;
    } else if (role !== outer.role) {
      this.flush();
    }
    return {
      ...outer,
      role,
      note,
      superscript: outer.superscript || name === "sup",
    };
  }

  /**
   * Ends the open paragraph where a block starts. Returns the context inside
   * the element, and what its end ends.
   */
  private enter(
    element: XmlElement,
    name: string,
    context: Context,
  ): { inner: Context; end: "paragraph" | "line" | null } {
    if (HEADINGS.has(name) || name === "hgroup") {
      this.flush();
      const chapter = name !== "hgroup";
      return {
        inner: { ...context, kind: "heading", verseDepth: null, chapter },
        end: "paragraph",
      };
    }
    if (context.verseDepth === null && isVerse(element)) {
      this.flush();
      return {
        inner: { ...context, kind: "verse", verseDepth: 0, chapter: false },
        end: "paragraph",
      };
    }
    if (!BLOCKS.has(name)) return { inner: context, end: null };
    if (context.verseDepth === null) {
      this.flush();
      return { inner: context, end: "paragraph" };
    }
    // In verse, a block at the top is a stanza; a block inside one is a line.
    const inner = { ...context, verseDepth: context.verseDepth + 1 };
    if (context.verseDepth === 0) {
      this.flush();
      return { inner, end: "paragraph" };
    }
    this.lineBreak();
    return { inner, end: "line" };
  }

  /** Adds text to the open paragraph, starting one if none is open. */
  private write(text: string, context?: Context): void {
    const clean = text
      .replace(REMOVED, "")
      .replace(NO_BREAK_SPACES, " ")
      .replace(XML_WHITESPACE, " ");
    if (clean === "") return;
    if (context && this.isEmpty() && clean.trim() !== "") {
      this.kind = context.kind;
      this.chapter = context.chapter && !context.note;
      this.role = context.role;
    }
    this.line += clean;
  }

  private lineBreak(): void {
    this.lines.push(this.line);
    this.line = "";
  }

  private isEmpty(): boolean {
    return this.line.trim() === "" && this.lines.every((l) => l.trim() === "");
  }

  /** Ends the open paragraph, keeping it if it has any text. */
  flush(): void {
    const lines = [...this.lines, this.line]
      .map((line) => line.replace(/ {2,}/g, " ").trim())
      .filter((line) => line !== "");
    this.lines = [];
    this.line = "";
    if (lines.length === 0) return;
    const paragraph: Paragraph =
      this.kind === "verse"
        ? { kind: "verse", lines }
        : { kind: this.kind, text: lines.join("\n") };
    if (this.inNote) {
      this.notes.push(paragraph);
    } else {
      if (this.chapter) this.headings.push(this.paragraphs.length);
      this.paragraphs.push(paragraph);
      this.roles.push(this.role);
    }
    this.kind = "prose";
    this.chapter = false;
    this.role = null;
  }

  content(): Content {
    // An id after the last paragraph points at the last one.
    clampAnchors(this.anchors, this.paragraphs.length);
    clampAnchors(this.noteAnchors, this.notes.length);
    return {
      paragraphs: this.paragraphs,
      roles: this.roles,
      anchors: this.anchors,
      headings: this.headings,
      notes: this.notes,
      noteAnchors: this.noteAnchors,
    };
  }
}

function clampAnchors(anchors: Map<string, number>, count: number): void {
  const last = Math.max(0, count - 1);
  for (const [id, index] of anchors) {
    if (index > last) anchors.set(id, last);
  }
}

/**
 * True for a note marker (SPEC.md feature 2): a link marked as one, or an
 * internal link whose whole text reads as one (`BRACKETED_MARKER`), or a
 * bare number in superscript.
 */
function isMarker(element: XmlElement, name: string, context: Context) {
  if (name !== "a") return false;
  const types = [...tokens(element, "epub:type"), ...tokens(element, "role")];
  if (types.some((t) => MARKER_TYPES.has(t))) return true;
  if (tokens(element, "class").some((c) => MARKER_CLASSES.has(c))) return true;
  const href = element.attributes.get("href");
  if (href === undefined || /^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
  const text = collapseWhitespace(textContent(element));
  if (BRACKETED_MARKER.test(text)) return true;
  const superscript =
    context.superscript ||
    elements(element).some((child) => localName(child.name) === "sup");
  return superscript && NUMBER_MARKER.test(text);
}

function isVerse(element: XmlElement): boolean {
  return (
    tokens(element, "epub:type").some((t) => VERSE_TYPES.has(t)) ||
    tokens(element, "class").some((c) => VERSE_CLASSES.has(c))
  );
}
