import { describe, expect, it } from "vitest";
import {
  bookSource,
  libraryBooks,
  libraryOrder,
  type BookInfo,
  type BuiltInBook,
} from "./library.ts";
import type { Reading } from "./position.ts";

function book(title: string, openedAt?: number): BookInfo {
  return {
    id: title,
    title,
    author: "Unknown author",
    addedAt: 0,
    ...(openedAt === undefined ? {} : { openedAt }),
  };
}

describe("libraryOrder", () => {
  it("lists the most recently opened first and unopened books last", () => {
    const books = [
      book("Unopened B"),
      book("Opened Monday", 1),
      book("Unopened A"),
      book("Opened Wednesday", 3),
      book("Opened Tuesday", 2),
    ];
    expect(libraryOrder(books).map((b) => b.title)).toEqual([
      "Opened Wednesday",
      "Opened Tuesday",
      "Opened Monday",
      "Unopened A",
      "Unopened B",
    ]);
  });

  it("orders books opened at the same moment by title", () => {
    expect(
      libraryOrder([book("B", 5), book("A", 5)]).map((b) => b.title),
    ).toEqual(["A", "B"]);
  });

  it("leaves the books it was given as they were", () => {
    const books = [book("B"), book("A", 1)];
    libraryOrder(books);
    expect(books.map((b) => b.title)).toEqual(["B", "A"]);
  });
});

const start: Reading = {
  position: { section: 0, paragraph: 0, word: 0 },
  finished: false,
  progress: 0,
  left: [[1, 100]],
};

function builtIn(slug: string, id = `id-${slug}`): BuiltInBook {
  return {
    slug,
    id,
    title: `Title ${slug}`,
    author: "An author",
    summary: "A summary.",
    genres: ["Fiction"],
    reading: start,
  };
}

describe("libraryBooks", () => {
  it("lists a built-in book that isn't stored, at its start", () => {
    expect(libraryBooks([], [builtIn("a")])).toEqual([
      {
        id: "id-a",
        title: "Title a",
        author: "An author",
        addedAt: 0,
        reading: start,
        builtIn: "a",
      },
    ]);
  });

  it("lists a stored built-in book once, as stored", () => {
    // Its ID can differ from the catalog's once the splitting rules change.
    const stored = { ...book("Read", 5), id: "new-id", builtIn: "a" };
    expect(libraryBooks([stored], [builtIn("a")])).toEqual([stored]);
  });

  it("counts a book of your own with the same text as stored", () => {
    const own = { ...book("Imported", 5), id: "id-a" };
    expect(libraryBooks([own], [builtIn("a"), builtIn("b")])).toEqual([
      own,
      expect.objectContaining({ builtIn: "b" }),
    ]);
  });
});

describe("bookSource", () => {
  it("tells built-in books from your own", () => {
    expect(bookSource({ ...book("A"), builtIn: "a" })).toBe("free");
    expect(bookSource(book("B"))).toBe("mine");
  });
});
