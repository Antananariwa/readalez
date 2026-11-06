import { describe, expect, it } from "vitest";
import { libraryOrder, type BookInfo } from "./library.ts";

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
