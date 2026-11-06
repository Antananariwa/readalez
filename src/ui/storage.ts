// Storage on the device (issue #12, ADR 0007): the library in IndexedDB.
// The database's version is the schema version: each change to the stores
// adds a step to `upgrade`.

import type { BookInfo } from "../core/library.ts";
import type { Section } from "../core/text.ts";

const DATABASE = "readalez";
const VERSION = 1;

/** Store names. `books` holds `BookInfo`s, `texts` holds `StoredText`s. */
const BOOKS = "books";
const TEXTS = "texts";

interface StoredText {
  id: string;
  sections: Section[];
}

let opening: Promise<IDBDatabase> | null = null;

function database(): Promise<IDBDatabase> {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = (event) => upgrade(request.result, event);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error: unknown) => {
    // Lets a later call try again.
    opening = null;
    throw error;
  });
  return opening;
}

function upgrade(db: IDBDatabase, event: IDBVersionChangeEvent): void {
  if (event.oldVersion < 1) {
    db.createObjectStore(BOOKS, { keyPath: "id" });
    db.createObjectStore(TEXTS, { keyPath: "id" });
  }
}

/** Runs `work` in one transaction and resolves when it has committed. */
async function transaction<T>(
  stores: string[],
  mode: IDBTransactionMode,
  work: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const db = await database();
  const tx = db.transaction(stores, mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
  });
  let result: T;
  try {
    result = await work(tx);
  } catch (error) {
    done.catch(() => {});
    try {
      tx.abort();
    } catch {
      // Already committed or aborted.
    }
    throw error;
  }
  await done;
  return result;
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Every book in the library, in no particular order. */
export function listBooks(): Promise<BookInfo[]> {
  return transaction([BOOKS], "readonly", (tx) =>
    request(tx.objectStore(BOOKS).getAll() as IDBRequest<BookInfo[]>),
  );
}

/** A book's sections, or undefined if it isn't stored. */
export async function getText(id: string): Promise<Section[] | undefined> {
  const stored = await transaction([TEXTS], "readonly", (tx) =>
    request(
      tx.objectStore(TEXTS).get(id) as IDBRequest<StoredText | undefined>,
    ),
  );
  return stored?.sections;
}

/**
 * Adds a book and its text in one transaction, so nothing half-saved is left.
 * If a book with the same ID is already stored, nothing changes and that
 * book is returned (SPEC.md feature 1).
 */
export function addBook(
  book: BookInfo,
  sections: Section[],
): Promise<BookInfo> {
  return transaction([BOOKS, TEXTS], "readwrite", async (tx) => {
    const books = tx.objectStore(BOOKS);
    const existing = await request(
      books.get(book.id) as IDBRequest<BookInfo | undefined>,
    );
    if (existing) return existing;
    books.add(book);
    tx.objectStore(TEXTS).add({ id: book.id, sections } satisfies StoredText);
    return book;
  });
}

/** Changes one stored book's fields, if it's stored. */
function updateBook(id: string, change: Partial<BookInfo>): Promise<void> {
  return transaction([BOOKS], "readwrite", async (tx) => {
    const books = tx.objectStore(BOOKS);
    const book = await request(
      books.get(id) as IDBRequest<BookInfo | undefined>,
    );
    if (book) books.put({ ...book, ...change, id });
  });
}

export function markOpened(id: string, at: number): Promise<void> {
  return updateBook(id, { openedAt: at });
}

export function renameBook(id: string, title: string): Promise<void> {
  return updateBook(id, { title });
}

/** Deletes a book and its text in one transaction. */
export function deleteBook(id: string): Promise<void> {
  return transaction([BOOKS, TEXTS], "readwrite", (tx) => {
    tx.objectStore(BOOKS).delete(id);
    tx.objectStore(TEXTS).delete(id);
  });
}
