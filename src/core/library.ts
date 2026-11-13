// The library (SPEC.md features 3 and 4, issues #12, #13 and #17): what it
// knows about each book, the built-in books it lists before they're stored,
// and the order it lists them in.

import type { Reading } from "./position.ts";

/** What the library lists for a book; its text is stored apart. */
export interface BookInfo {
  /** `bookId` of its text. */
  id: string;
  title: string;
  author: string;
  /** When it was added, in ms since 1970. */
  addedAt: number;
  /** When it was last opened, in ms since 1970; absent until it's opened. */
  openedAt?: number;
  /**
   * Where reading stopped, with the progress the library shows; absent for
   * books stored before #13 until they're read (ADR 0008).
   */
  reading?: Reading;
  /**
   * The `BuiltInBook.slug` of a built-in book; absent for the reader's own
   * books (SPEC.md feature 3).
   */
  builtIn?: string;
}

/**
 * A built-in book as the generated catalog lists it
 * (`src/core/builtInBooks.ts`, built by `scripts/build-books.ts`), so the
 * library can show it before its text is imported (ADR 0013).
 */
export interface BuiltInBook {
  /** The Standard Ebooks repository it's built from; also its file's name. */
  slug: string;
  /** `bookId` of its text, as the build worked it out. */
  id: string;
  title: string;
  author: string;
  /** Standard Ebooks' one-line summary (`schema:abstract`). */
  summary: string;
  /** Standard Ebooks' genres (`schema:genre`), for filters after v1. */
  genres: string[];
  /** Where reading starts, with its progress and time left. */
  reading: Reading;
}

/** Where a book in the library comes from: built in (Public) or the reader's own. */
export type BookSource = "public" | "mine";

export function bookSource(book: BookInfo): BookSource {
  return book.builtIn === undefined ? "mine" : "public";
}

/**
 * The books the library lists: every stored book, then each built-in book
 * that isn't stored yet, so it shows from the first visit. A built-in book
 * counts as stored when a stored book has its slug, or its ID: the same text
 * imported by hand is the same book (ADR 0007). One not stored has no
 * `addedAt` time, so it shows 0.
 */
export function libraryBooks(
  stored: readonly BookInfo[],
  builtIns: readonly BuiltInBook[],
): BookInfo[] {
  const slugs = new Set(stored.map((book) => book.builtIn));
  const ids = new Set(stored.map((book) => book.id));
  const missing = builtIns.filter(
    (book) => !slugs.has(book.slug) && !ids.has(book.id),
  );
  return [
    ...stored,
    ...missing.map((book): BookInfo => ({
      id: book.id,
      title: book.title,
      author: book.author,
      addedAt: 0,
      reading: book.reading,
      builtIn: book.slug,
    })),
  ];
}

/**
 * The author a pasted text shows. EPUBs without an author fall back to the
 * same (SPEC.md features 1 and 2).
 */
export const UNKNOWN_AUTHOR = "Unknown author";

/**
 * The library's order: most recently opened first, then the books never
 * opened, by title.
 */
export function libraryOrder(books: readonly BookInfo[]): BookInfo[] {
  return books.toSorted((a, b) => {
    if (a.openedAt !== undefined && b.openedAt !== undefined) {
      return b.openedAt - a.openedAt || a.title.localeCompare(b.title);
    }
    if (a.openedAt !== undefined) return -1;
    if (b.openedAt !== undefined) return 1;
    return a.title.localeCompare(b.title);
  });
}
