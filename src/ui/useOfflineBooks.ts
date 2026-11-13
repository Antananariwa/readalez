// How far the service worker has got saving the built-in books for offline
// use (SPEC.md features 3 and 12). It downloads them in the background after
// the first page load; the library shows its progress, so a reader knows
// when the app works without a network (#17).

import { useEffect, useState } from "react";
import { BUILT_IN_BOOKS } from "../core/builtInBooks.ts";
import { serviceWorkerRegistration } from "./registerServiceWorker.ts";

export type OfflineBooks =
  /** Nothing to show: no service worker, or saved on an earlier visit. */
  | { state: "hidden" }
  | { state: "saving"; saved: number; total: number }
  /** Saved during this visit. */
  | { state: "ready" }
  /** The service worker's install failed, so saving stopped. */
  | { state: "failed" };

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
    /** Undefined until `register()` settles; null if it failed. */
    let registration: ServiceWorkerRegistration | null | undefined;
    void serviceWorkerRegistration().then((result) => {
      registration = result;
    });
    const check = async () => {
      try {
        const saved = await savedBooks();
        // A worker becomes active only after its install has stored every
        // file it precaches: Workbox's install handler stores them
        // (`PrecacheStrategy` in workbox-precaching), and a worker whose
        // install fails is discarded rather than activated (Service Worker
        // spec, https://w3c.github.io/ServiceWorker/#installation-algorithm).
        const done = saved === BUILT_IN_BOOKS.length && !!registration?.active;
        if (stopped) return;
        if (done) {
          setBooks(first ? { state: "hidden" } : { state: "ready" });
          return;
        }
        // `register()` resolves only once its worker is installing (same
        // algorithm, Install's first steps), so a registration with no
        // worker left means the install failed; the page doesn't register
        // again, nor after `register()` fails. A slow worker script only
        // delays both, so saving never fails on time alone.
        const failed =
          registration === null ||
          (registration !== undefined &&
            !registration.installing &&
            !registration.waiting &&
            !registration.active);
        if (failed) {
          setBooks({ state: "failed" });
          return;
        }
        setBooks({ state: "saving", saved, total: BUILT_IN_BOOKS.length });
      } catch {
        // Cache storage the browser won't open (possibly some private
        // windows: not checked) leaves nothing to show.
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
 * a file listed with a revision under its URL plus a `__WB_REVISION__`
 * parameter (`createCacheKey` in workbox-precaching 7.4.1:
 * https://github.com/GoogleChrome/workbox/blob/v7.4.1/packages/workbox-precaching/src/utils/createCacheKey.ts),
 * and `dist/sw.js` lists each book with one, so the search part is ignored.
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
