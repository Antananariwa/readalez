// Builds ZIP files in memory: small EPUBs for the tests, and the built-in
// books for `scripts/build-books.ts`. Not used by the app.

import { utf8 } from "../bookId.ts";
import { crc32 } from "./zip.ts";

/** Compresses bytes as raw DEFLATE, such as Node's `zlib.deflateRawSync`. */
export type Deflate = (data: Uint8Array<ArrayBuffer>) => Uint8Array;

/** A ZIP archive (APPNOTE.TXT, linked in `zip.ts`) of stored files. */
export function storedZip(
  files: Record<string, string | Uint8Array<ArrayBuffer>>,
): Uint8Array<ArrayBuffer> {
  return zipArchive(files);
}

/**
 * A ZIP archive of `files`, in the order given. With `deflate`, every file
 * but `mimetype` is deflated, which EPUB requires to be stored (EPUB 3.3,
 * `sec-zip-container-mime`). Every entry has the same date, 1 January 1980,
 * so the same files give the same bytes.
 */
export function zipArchive(
  files: Record<string, string | Uint8Array<ArrayBuffer>>,
  deflate?: Deflate,
): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array<ArrayBuffer>[] = [];
  const directory: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files)) {
    const name = utf8(path);
    const raw = typeof content === "string" ? utf8(content) : content;
    const crc = crc32(raw);
    const deflated = deflate !== undefined && path !== "mimetype";
    const data = deflated ? new Uint8Array(deflate(raw)) : raw;
    const method = deflated ? 8 : 0;
    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true); // UTF-8 names
    l.setUint16(8, method, true);
    l.setUint16(12, DOS_DATE, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, data.length, true);
    l.setUint32(22, raw.length, true);
    l.setUint16(26, name.length, true);
    local.set(name, 30);

    const entry = new Uint8Array(46 + name.length);
    const c = new DataView(entry.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, method, true);
    c.setUint16(14, DOS_DATE, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, raw.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    entry.set(name, 46);

    parts.push(local, data);
    directory.push(entry);
    offset += local.length + data.length;
  }
  const directorySize = directory.reduce((sum, e) => sum + e.length, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, directory.length, true);
  e.setUint16(10, directory.length, true);
  e.setUint32(12, directorySize, true);
  e.setUint32(16, offset, true);
  return concat([...parts, ...directory, end]);
}

/** 1 January 1980 in MS-DOS date format: the earliest date a ZIP can hold. */
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

export function concat(
  parts: readonly Uint8Array<ArrayBuffer>[],
): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** What a test EPUB holds; anything left out gets a minimal default. */
export interface TestBook {
  /** The OPF's `<metadata>` content. */
  metadata?: string;
  /** Content documents by file name, in spine order, as `<body>` content. */
  documents: Record<string, string>;
  /** The navigation document's `<body>` content; no nav if left out. */
  nav?: string;
  /** EPUB 2's NCX `<navMap>` content; no NCX if left out. */
  ncx?: string;
  /** EPUB 2's `<guide>` content; no guide if left out. */
  guide?: string;
  /** The package's version attribute. */
  version?: "2.0" | "3.0";
  /** Other files, by their full path, such as `META-INF/encryption.xml`. */
  files?: Record<string, string>;
}

/** An EPUB file with the package at `OEBPS/content.opf`. */
export function testEpub(book: TestBook): Uint8Array<ArrayBuffer> {
  const names = Object.keys(book.documents);
  const items = names
    .map(
      (name, i) =>
        `<item id="d${i}" href="${name}" media-type="application/xhtml+xml"/>`,
    )
    .join("");
  const files: Record<string, string> = {
    mimetype: "application/epub+zip",
    "META-INF/container.xml":
      '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
    "OEBPS/content.opf": `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf" version="${book.version ?? "3.0"}">
<metadata>${book.metadata ?? ""}</metadata>
<manifest>${items}${book.nav === undefined ? "" : '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'}${book.ncx === undefined ? "" : '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'}</manifest>
<spine${book.ncx === undefined ? "" : ' toc="ncx"'}>${names.map((_, i) => `<itemref idref="d${i}"/>`).join("")}</spine>
${book.guide === undefined ? "" : `<guide>${book.guide}</guide>`}
</package>`,
  };
  for (const name of names) {
    files[`OEBPS/${name}`] = xhtml(book.documents[name]!);
  }
  if (book.nav !== undefined) files["OEBPS/nav.xhtml"] = xhtml(book.nav);
  if (book.ncx !== undefined) {
    files["OEBPS/toc.ncx"] =
      `<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><navMap>${book.ncx}</navMap></ncx>`;
  }
  return storedZip({ ...files, ...book.files });
}

/** A content document with `body` as its body's content. */
export function xhtml(body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Test</title></head>
<body>${body}</body>
</html>`;
}
