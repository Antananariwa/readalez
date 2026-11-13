// Describes a built-in book's EPUB for the catalog in src/core/builtInBooks.ts
// (SPEC.md feature 3, ADR 0013). `scripts/build-books.ts` runs it on each
// book it builds, and `tests/builtInBooks.test.ts` reruns it to check the
// catalog still matches the files. It uses the same core code as importing
// an EPUB in the app (`src/ui/importEpub.ts` and `src/ui/App.tsx`).

import { bookId } from "../src/core/bookId.ts";
import { timeWords } from "../src/core/durations.ts";
import { parseEpub } from "../src/core/epub.ts";
import { openZip, type Zip } from "../src/core/epub/zip.ts";
import {
  descendantsNamed,
  parseXml,
  type XmlElement,
} from "../src/core/epub/xml.ts";
import type { BuiltInBook } from "../src/core/library.ts";
import { progressTable, readingState } from "../src/core/position.ts";
import { flowStart, readingFlow } from "../src/core/readingFlow.ts";
import { splitText } from "../src/core/text.ts";

/** File names of pictures, which the built-in books leave out. */
const IMAGE = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

/** The pictures in an EPUB; none in a built-in book (SPEC.md feature 3). */
export function imagePaths(zip: Zip): string[] {
  return zip.paths.filter((path) => IMAGE.test(path));
}

/**
 * What the catalog lists for the EPUB `bytes`, built from the Standard
 * Ebooks repository `slug`: its metadata, the ID of its text and where its
 * reading starts, as importing it in the app would give.
 */
export async function describeBook(
  slug: string,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<BuiltInBook> {
  const zip = openZip(bytes);
  const images = imagePaths(zip);
  if (images.length > 0) {
    throw new Error(`${slug} has pictures: ${images.join(", ")}`);
  }
  const book = await parseEpub(bytes, `${slug}.epub`);
  const timing = timeWords(splitText(book.sections));
  const flow = readingFlow(timing.words, book.parts);
  const opf = await packageDocument(zip);
  const summary = metaValues(opf, "schema:abstract")[0];
  if (summary === undefined) throw new Error(`${slug} has no summary`);
  return {
    slug,
    id: bookId(book.sections),
    title: book.title,
    author: book.author,
    summary,
    genres: metaValues(opf, "schema:genre"),
    reading: readingState(
      timing,
      progressTable(timing),
      flowStart(flow),
      false,
      flow,
    ),
  };
}

async function packageDocument(zip: Zip): Promise<XmlElement> {
  const container = await xml(zip, "META-INF/container.xml");
  const path = descendantsNamed(container, "rootfile")[0]?.attributes.get(
    "full-path",
  );
  if (path === undefined) throw new Error("No package document");
  return xml(zip, path);
}

async function xml(zip: Zip, path: string): Promise<XmlElement> {
  return parseXml(new TextDecoder().decode(await zip.read(path)));
}

/** The text of each `<meta property="…">` with this property, in order. */
function metaValues(opf: XmlElement, property: string): string[] {
  return descendantsNamed(opf, "meta")
    .filter((meta) => meta.attributes.get("property") === property)
    .map((meta) =>
      meta.children
        .filter((child) => typeof child === "string")
        .join("")
        .trim(),
    );
}
