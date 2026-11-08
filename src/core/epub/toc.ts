// An EPUB's table of contents (SPEC.md feature 2): EPUB 3's navigation
// document, or EPUB 2's NCX. Each entry names a document and a place in it.
// EPUB 3.3's `toc` nav, in the W3C's source for the spec:
// https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/epub33/core/index.html
// The NCX's `navMap` of nested `navPoint`s, in EPUB 2's OPF spec (section 2.4.1):
// https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/archive/epub201/OPF_2.0.1_draft.htm

import { resolveHref, type Target } from "./package.ts";
import {
  childrenNamed,
  collapseWhitespace,
  descendantsNamed,
  elements,
  localName,
  textContent,
  tokens,
  type XmlElement,
} from "./xml.ts";

/** One entry of the table of contents, before it's matched to the text. */
export interface TocEntry {
  title: string;
  /** 0 for the top level, 1 for the entries under one, and so on. */
  depth: number;
  target: Target;
}

/**
 * The entries of the navigation document's `toc` nav, in order. Its nested
 * lists give the depths; a list item without a link is left out, and the
 * items under it keep their depth.
 */
export function navEntries(nav: XmlElement, path: string): TocEntry[] {
  const toc = descendantsNamed(nav, "nav").find((element) =>
    tokens(element, "epub:type").includes("toc"),
  );
  if (!toc) return [];
  const entries: TocEntry[] = [];
  const visitList = (list: XmlElement, depth: number) => {
    for (const item of childrenNamed(list, "li")) {
      const link = elements(item).find(
        (child) => localName(child.name) === "a",
      );
      const href = link?.attributes.get("href");
      const target = href === undefined ? null : resolveHref(path, href);
      if (link && target) {
        entries.push({
          title: collapseWhitespace(textContent(link)),
          depth,
          target,
        });
      }
      for (const sublist of childrenNamed(item, "ol"))
        visitList(sublist, depth + 1);
    }
  };
  for (const list of childrenNamed(toc, "ol")) visitList(list, 0);
  return entries;
}

/** The entries of an NCX's `navMap`, in order. */
export function ncxEntries(ncx: XmlElement, path: string): TocEntry[] {
  const navMap = descendantsNamed(ncx, "navMap")[0];
  if (!navMap) return [];
  const entries: TocEntry[] = [];
  const visit = (parent: XmlElement, depth: number) => {
    for (const point of childrenNamed(parent, "navPoint")) {
      const label = childrenNamed(point, "navLabel")[0];
      const src = childrenNamed(point, "content")[0]?.attributes.get("src");
      const target = src === undefined ? null : resolveHref(path, src);
      if (label && target) {
        entries.push({
          title: collapseWhitespace(textContent(label)),
          depth,
          target,
        });
      }
      visit(point, depth + 1);
    }
  };
  visit(navMap, 0);
  return entries;
}
