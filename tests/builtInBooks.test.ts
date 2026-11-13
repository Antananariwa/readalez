// The built-in books (SPEC.md feature 3, issue #17): the files in
// public/books and their catalog, src/core/builtInBooks.ts, both built by
// `npm run books` (scripts/build-books.ts, ADR 0013). These tests read
// files, which tests in src/core can't (ADR 0009), so they live here.

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { describeBook, imagePaths } from "../scripts/builtInBook.ts";
import { BUILT_IN_BOOKS } from "../src/core/builtInBooks.ts";
import { parseEpub } from "../src/core/epub.ts";
import { openZip } from "../src/core/epub/zip.ts";

const BOOKS = new URL("../public/books/", import.meta.url);

function bytes(slug: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(readFileSync(new URL(`${slug}.epub`, BOOKS)));
}

const slugs = BUILT_IN_BOOKS.map((book) => book.slug);

/**
 * Where each book's reading flow starts: the first paragraph (or verse line)
 * of its first part not skipped, as read from the built files on 2026-11-12.
 * Dedications, epigraphs and prefaces are the author's (SPEC.md feature 2).
 */
const STARTS: [slug: string, first: string][] = [
  [
    "robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde",
    "Story of the Door",
  ],
  [
    "lewis-carroll_alices-adventures-in-wonderland_john-tenniel",
    "All in the golden afternoon",
  ],
  ["charles-dickens_a-christmas-carol", "Preface"],
  ["jack-london_the-call-of-the-wild", "“Old longings nomadic leap,"],
  ["h-g-wells_the-time-machine", "I"],
  ["l-frank-baum_the-wonderful-wizard-of-oz", "Introduction"],
  ["henry-james_the-turn-of-the-screw", "Prologue"],
  ["marcus-aurelius_meditations_george-long", "Book I"],
  ["f-scott-fitzgerald_the-great-gatsby", "Once again"],
  [
    "rudyard-kipling_the-jungle-book",
    "Now Rann, the Kite, brings home the night",
  ],
  ["arthur-conan-doyle_the-hound-of-the-baskervilles", "My Dear Robinson,"],
  ["anna-sewell_black-beauty", "Part I"],
  ["h-g-wells_the-war-of-the-worlds", "To"],
  ["jules-verne_around-the-world-in-eighty-days_george-makepeace-towle", "I"],
  ["jerome-k-jerome_three-men-in-a-boat", "Preface"],
  ["robert-louis-stevenson_treasure-island", "To the Hesitating Purchaser"],
  ["mary-shelley_frankenstein", "Introduction"],
  ["oscar-wilde_the-picture-of-dorian-gray", "Preface"],
  ["frances-hodgson-burnett_the-secret-garden", "I"],
  ["baroness-orczy_the-scarlet-pimpernel", "To"],
  ["l-m-montgomery_anne-of-green-gables", "I"],
  ["henry-david-thoreau_walden", "Economy"],
  ["jane-austen_pride-and-prejudice", "I"],
  ["bram-stoker_dracula", "To"],
];

describe("built-in books", () => {
  it("has one file for each book in the catalog, and no other", () => {
    expect(readdirSync(BOOKS).toSorted()).toEqual(
      slugs.map((slug) => `${slug}.epub`).toSorted(),
    );
  });

  it("gives each book its own ID", () => {
    expect(new Set(BUILT_IN_BOOKS.map((book) => book.id)).size).toBe(
      BUILT_IN_BOOKS.length,
    );
  });

  it.each(slugs)("%s contains no images", (slug) => {
    expect(imagePaths(openZip(bytes(slug)))).toEqual([]);
  });

  it("has a start in STARTS for every book, in the catalog's order", () => {
    expect(STARTS.map(([slug]) => slug)).toEqual(slugs);
  });

  it.each(STARTS)("%s starts reading at “%s”", async (slug, first) => {
    const book = await parseEpub(bytes(slug), `${slug}.epub`);
    const part = book.parts.find((p) => !p.skipped)!;
    const paragraph = book.sections[part.section]!.paragraphs[part.paragraph]!;
    const text =
      paragraph.kind === "verse" ? paragraph.lines[0] : paragraph.text;
    expect(text?.split("\n")[0]).toBe(first);
  });

  it("describes a book as the files say, so the catalog is up to date", async () => {
    // The shortest book, to keep the test quick. If this fails after a change
    // to splitting or timing, run `npm run books` to rebuild the catalog.
    const shortest = BUILT_IN_BOOKS[0]!;
    expect(await describeBook(shortest.slug, bytes(shortest.slug))).toEqual(
      shortest,
    );
  });
});
