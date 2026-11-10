// The EPUB package (ADR 0009): where the package document is, and what it
// says about the book. EPUB 3.3's package document (metadata, manifest,
// spine), in the W3C's source for the spec:
// https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/epub33/core/index.html
// EPUB 2's OPF, with `opf:role` and the spine's `toc` attribute for the NCX:
// https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/archive/epub201/OPF_2.0.1_draft.htm

import {
  childrenNamed,
  collapseWhitespace,
  descendantsNamed,
  localName,
  textContent,
  tokens,
  type XmlElement,
} from "./xml.ts";

/** A spine item: one document of the reading order. */
export interface SpineItem {
  /** Its full path in the archive. */
  path: string;
  mediaType: string;
}

/** What the package document says about the book. */
export interface Package {
  title: string | null;
  /** The authors' names, in the order the metadata lists them. */
  authors: string[];
  spine: SpineItem[];
  /** The EPUB 3 navigation document's path, if there is one. */
  nav: string | null;
  /** The EPUB 2 NCX's path, if there is one. */
  ncx: string | null;
  /** EPUB 2's guide: the documents it names, with their types. */
  guide: GuideReference[];
}

/** An EPUB 2 guide `reference`, such as `type="toc"`. */
export interface GuideReference {
  type: string;
  target: Target;
}

/** Thrown when the package can't be found or has no reading order. */
export class PackageError extends Error {}

/** The package document's path, from `META-INF/container.xml`. */
export function rootfilePath(container: XmlElement): string {
  const rootfile = descendantsNamed(container, "rootfile")[0];
  const path = rootfile?.attributes.get("full-path");
  if (!path) throw new PackageError("No rootfile in container.xml");
  return path;
}

/** Reads the package document at `path`. */
export function readPackage(opf: XmlElement, path: string): Package {
  const metadata = childrenNamed(opf, "metadata")[0];
  const manifest = childrenNamed(opf, "manifest")[0];
  const spine = childrenNamed(opf, "spine")[0];
  if (!manifest || !spine) throw new PackageError("No manifest or spine");

  const items = new Map<string, { path: string; mediaType: string }>();
  let nav: string | null = null;
  for (const item of childrenNamed(manifest, "item")) {
    const id = item.attributes.get("id");
    const href = item.attributes.get("href");
    if (!id || !href) continue;
    const resolved = resolveHref(path, href);
    if (!resolved) continue;
    const entry = {
      path: resolved.path,
      mediaType: item.attributes.get("media-type") ?? "",
    };
    items.set(id, entry);
    if (tokens(item, "properties").includes("nav")) nav = entry.path;
  }

  const ncxId = spine.attributes.get("toc");
  const ncx = (ncxId && items.get(ncxId)?.path) || null;
  const guide = childrenNamed(opf, "guide")[0];
  return {
    title: metadata ? mainTitle(metadata) : null,
    authors: metadata ? authors(metadata) : [],
    spine: childrenNamed(spine, "itemref").map(
      (itemref) =>
        items.get(itemref.attributes.get("idref") ?? "") ?? {
          path: "",
          mediaType: "",
        },
    ),
    nav,
    ncx,
    guide: guide
      ? childrenNamed(guide, "reference").flatMap((reference) => {
          const type = reference.attributes.get("type");
          const href = reference.attributes.get("href");
          const target = href === undefined ? null : resolveHref(path, href);
          return type && target ? [{ type: type.toLowerCase(), target }] : [];
        })
      : [],
  };
}

/**
 * The `dc:title` that EPUB 3's `title-type` marks as `main`, or else the
 * first one.
 */
function mainTitle(metadata: XmlElement): string | null {
  const titles = childrenNamed(metadata, "title")
    .map((title) => ({
      text: collapseWhitespace(textContent(title)),
      types: refinements(metadata, title, "title-type"),
    }))
    .filter((title) => title.text !== "");
  return (
    (titles.find((t) => t.types.includes("main")) ?? titles[0])?.text ?? null
  );
}

/**
 * The `dc:creator`s whose role is author (MARC relator `aut`) or who have
 * no role. EPUB 3 gives the role in a `meta` that refines the creator, EPUB 2
 * in an `opf:role` attribute.
 */
function authors(metadata: XmlElement): string[] {
  return childrenNamed(metadata, "creator")
    .filter((creator) => {
      const roles = [
        ...refinements(metadata, creator, "role"),
        ...attributesNamed(creator, "role"),
      ];
      return roles.length === 0 || roles.includes("aut");
    })
    .map((creator) => collapseWhitespace(textContent(creator)))
    .filter((name) => name !== "");
}

/** The values of EPUB 3 `meta` elements with this property that refine `element`. */
function refinements(
  metadata: XmlElement,
  element: XmlElement,
  property: string,
): string[] {
  const id = element.attributes.get("id");
  if (!id) return [];
  return childrenNamed(metadata, "meta")
    .filter(
      (meta) =>
        meta.attributes.get("refines") === `#${id}` &&
        meta.attributes.get("property") === property,
    )
    .map((meta) => collapseWhitespace(textContent(meta)));
}

/** Values of prefixed attributes with this local name, such as `opf:role`. */
function attributesNamed(element: XmlElement, name: string): string[] {
  return [...element.attributes]
    .filter(([key]) => key.includes(":") && localName(key) === name)
    .map(([, value]) => value.trim());
}

/** A path in the archive, and the fragment after `#`. */
export interface Target {
  path: string;
  fragment: string | null;
}

/**
 * Resolves `href`, relative to the document at `from`, to a path in the
 * archive. Percent-escapes are decoded, since archive paths aren't escaped.
 * Links to other sites give null.
 */
export function resolveHref(from: string, href: string): Target | null {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;
  const hash = href.indexOf("#");
  const pathPart = hash === -1 ? href : href.slice(0, hash);
  const fragment = hash === -1 ? null : decode(href.slice(hash + 1));
  if (pathPart === "") return { path: from, fragment };
  const segments = pathPart.startsWith("/") ? [] : from.split("/").slice(0, -1);
  for (const segment of decode(pathPart).split("/")) {
    if (segment === "..") segments.pop();
    else if (segment !== "." && segment !== "") segments.push(segment);
  }
  return { path: segments.join("/"), fragment };
}

function decode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** True for the media types of XHTML content documents. */
export function isXhtml(mediaType: string): boolean {
  return mediaType === "application/xhtml+xml";
}
