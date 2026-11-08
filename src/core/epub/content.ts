// An EPUB content document (SPEC.md feature 2): XHTML in, the text model's
// paragraphs out (`src/core/text.ts`). Headings, paragraphs, block quotes,
// list items and table rows each become a paragraph, and verse keeps its
// lines. Images go, with their alt text and captions.

import type { Paragraph } from "../text.ts";
import { childrenNamed, localName, tokens, type XmlElement } from "./xml.ts";

/** A content document as paragraphs, with where its ids and headings are. */
export interface Content {
  paragraphs: Paragraph[];
  /**
   * For each element id, the index of the paragraph at or after it, so a
   * link with a `#fragment` can find its place.
   */
  anchors: Map<string, number>;
  /** Indices of the paragraphs that came from `h1` to `h6`. */
  headings: number[];
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

type Kind = Paragraph["kind"];

/** Reads a content document's `body` into paragraphs. */
export function readContent(document: XmlElement): Content {
  const body = childrenNamed(document, "body")[0] ?? document;
  const builder = new Builder();
  builder.visit(body, { kind: "prose", verseDepth: null, chapter: false });
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
}

class Builder {
  private readonly paragraphs: Paragraph[] = [];
  private readonly anchors = new Map<string, number>();
  private readonly headings: number[] = [];
  /** The open paragraph's finished lines, and the line being written. */
  private lines: string[] = [];
  private line = "";
  private kind: Kind = "prose";
  private chapter = false;

  visit(element: XmlElement, context: Context): void {
    const name = localName(element.name);
    if (DROPPED.has(name)) return;
    if (tokens(element, "class").some((c) => DROPPED_CLASSES.has(c))) return;
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
    if (id !== undefined && !this.anchors.has(id)) {
      this.anchors.set(id, this.paragraphs.length);
    }
    if (CELLS.has(name)) this.write(" ");
    for (const child of element.children) {
      if (typeof child === "string") this.write(child, inner);
      else this.visit(child, inner);
    }
    if (CELLS.has(name)) this.write(" ");
    if (end === "paragraph") this.flush();
    else if (end === "line") this.lineBreak();
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
        inner: { kind: "heading", verseDepth: null, chapter },
        end: "paragraph",
      };
    }
    if (context.verseDepth === null && isVerse(element)) {
      this.flush();
      return {
        inner: { kind: "verse", verseDepth: 0, chapter: false },
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
      this.chapter = context.chapter;
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
    if (this.chapter) this.headings.push(this.paragraphs.length);
    this.paragraphs.push(
      this.kind === "verse"
        ? { kind: "verse", lines }
        : { kind: this.kind, text: lines.join("\n") },
    );
    this.kind = "prose";
    this.chapter = false;
  }

  content(): Content {
    // An id after the last paragraph points at the last one.
    const last = Math.max(0, this.paragraphs.length - 1);
    for (const [id, index] of this.anchors) {
      if (index > last) this.anchors.set(id, last);
    }
    return {
      paragraphs: this.paragraphs,
      anchors: this.anchors,
      headings: this.headings,
    };
  }
}

function isVerse(element: XmlElement): boolean {
  return (
    tokens(element, "epub:type").some((t) => VERSE_TYPES.has(t)) ||
    tokens(element, "class").some((c) => VERSE_CLASSES.has(c))
  );
}
