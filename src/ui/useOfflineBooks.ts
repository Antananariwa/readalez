// How far the service worker has got saving the built-in books for offline
// use (SPEC.md features 3 and 12). It downloads them in the background after
// the first page load; the library shows its progress, so a reader knows
// when the app works without a network (#17).

import { useEffect, useState } from "react";
import { BUILT_IN_BOOKS } from "../core/builtInBooks.ts";

export type OfflineBooks =
  /** Nothing to show: no service worker, or saved on an earlier visit. */
  | { state: "hidden" }
  | { state: "saving"; saved: number; total: number }
  /** Saved during this visit. */
  | { state: "ready" };

/** How often to count the saved books while they download. */
const POLL_MS = 1000;

export function useOfflineBooks(): OfflineBooks {
  const [books, setBooks] = useState<OfflineBooks>({ state: "hidden" });

  useEffect(() => {
    if (
      !import.meta.env.PROD ||
      !("serviceWorker" in navigator) ||
      !("caches" in window)
    ) {
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let first = true;
    const check = async () => {
      try {
        const saved = await savedBooks();
        const registration = await navigator.serviceWorker.getRegistration();
        // The worker is active once it has saved every file it precaches.
        const done = saved === BUILT_IN_BOOKS.length && !!registration?.active;
        if (stopped) return;
        if (done) {
          setBooks(first ? { state: "hidden" } : { state: "ready" });
          return;
        }
        setBooks({ state: "saving", saved, total: BUILT_IN_BOOKS.length });
      } catch {
        // Storage the browser won't open, as in some private windows.
        if (!stopped) setBooks({ state: "hidden" });
        return;
      }
      first = false;
      timer = setTimeout(() => void check(), POLL_MS);
    };
    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  return books;
}

/**
 * How many built-in books are in the service worker's cache. Workbox stores
 * a file without a hash in its name under its URL plus a revision parameter,
 * so the search part is ignored.
 */
async function savedBooks(): Promise<number> {
  const found = await Promise.all(
    BUILT_IN_BOOKS.map((book) =>
      caches.match(`${import.meta.env.BASE_URL}books/${book.slug}.epub`, {
        ignoreSearch: true,
      }),
    ),
  );
  return found.filter((response) => response !== undefined).length;
}
