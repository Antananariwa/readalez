// Workbox's generated service worker skips waiting if a page posts
// SKIP_WAITING to it (e2e/pwa.spec.ts). An update must never apply while you
// read (SPEC.md feature 12), so the app's code must never send that message.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = new URL("../../src/", import.meta.url);
const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter(
  (path) => /\.(ts|tsx)$/.test(path),
);

describe("service worker updates", () => {
  it("finds the app's source files", () => {
    expect(files).toContain("ui/registerServiceWorker.ts");
  });

  it.each(files)("%s never tells the worker to skip waiting", (path) => {
    const code = readFileSync(new URL(path, src), "utf8");
    expect(code).not.toMatch(/SKIP_WAITING|skipWaiting/i);
  });
});
