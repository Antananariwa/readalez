// The library (SPEC.md feature 4, issues #12 and #13): what it knows about
// each book, and the order it lists them in.

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
