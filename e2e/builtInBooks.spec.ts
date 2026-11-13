import { expect, test, type Page } from "@playwright/test";
import { BUILT_IN_BOOKS } from "../src/core/builtInBooks.ts";
import { bookTimeLeft } from "../src/core/position.ts";
import { formatDuration } from "../src/core/timeLeft.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";
import { ownRows } from "./helpers.ts";

// The built-in books (issue #17, SPEC.md features 3 and 4): listed in the
// library from the first visit under the Public chip, permanent, imported on
// their first open from the EPUB the service worker keeps, and readable
// offline after the first visit.

const rows = (page: Page) =>
  page.getByRole("list", { name: "Library" }).getByRole("listitem");

const titles = (page: Page) => rows(page).locator(".book-title");

const row = (page: Page, title: string) =>
  rows(page).filter({
    has: page.locator(".book-title").getByText(title, { exact: true }),
  });

const chip = (page: Page, name: string) =>
  page.getByRole("group", { name: "Show" }).getByRole("button", { name });

const jekyll = BUILT_IN_BOOKS.find((book) =>
  book.title.startsWith("The Strange Case of Dr. Jekyll"),
)!;

async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}

/** Opens a built-in book and waits for the reader. */
async function openBook(page: Page, title: string): Promise<void> {
  await row(page, title).locator(".book").click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible({
    timeout: 30_000,
  });
}

test("a fresh visit lists every built-in book at 0%, with its summary and no options", async ({
  page,
}) => {
  await page.goto("/");
  await expect(titles(page)).toHaveCount(BUILT_IN_BOOKS.length);
  await expect(titles(page)).toHaveText(
    BUILT_IN_BOOKS.map((book) => book.title).toSorted((a, b) =>
      a.localeCompare(b),
    ),
  );
  const first = row(page, jekyll.title);
  await expect(first).toContainText(jekyll.author);
  await expect(first).toContainText(jekyll.summary);
  await expect(first).toContainText("Not opened yet");
  await expect(first.getByTestId("book-progress")).toHaveText("0%");
  await expect(first.getByTestId("book-left")).toHaveText(
    formatDuration(bookTimeLeft(jekyll.reading.left, DEFAULT_WPM)),
  );
  // Built-in books can't be renamed or deleted (SPEC.md feature 3).
  await expect(page.getByRole("button", { name: /^Options for / })).toHaveCount(
    0,
  );
});

test("All, Public and My books each show their books, with one chip always on", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByLabel("Paste text").fill("Marley was dead: to begin with.");
  await page.getByLabel("Title").fill("Mine");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const all = BUILT_IN_BOOKS.length + 1;
  await expect(chip(page, "All")).toHaveAttribute("aria-pressed", "true");
  await expect(titles(page)).toHaveCount(all);

  await chip(page, "My books").click();
  await expect(chip(page, "My books")).toHaveAttribute("aria-pressed", "true");
  await expect(titles(page)).toHaveText(["Mine"]);

  await chip(page, "Public").click();
  await expect(chip(page, "My books")).toHaveAttribute("aria-pressed", "false");
  await expect(titles(page)).toHaveCount(BUILT_IN_BOOKS.length);
  await expect(titles(page).getByText("Mine", { exact: true })).toHaveCount(0);

  // The chip stays on after reading a book.
  await openBook(page, jekyll.title);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(chip(page, "Public")).toHaveAttribute("aria-pressed", "true");

  // Tapping the chip that's on keeps it on.
  await chip(page, "Public").click();
  await expect(chip(page, "Public")).toHaveAttribute("aria-pressed", "true");
  await chip(page, "All").click();
  await expect(chip(page, "Public")).toHaveAttribute("aria-pressed", "false");
  await expect(titles(page)).toHaveCount(all);
});

test("My books says so when there are none", async ({ page }) => {
  await page.goto("/");
  await chip(page, "My books").click();
  await expect(page.getByText("No texts of your own yet.")).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
});

test("a built-in book opens where the author's text starts, plays, and keeps its progress", async ({
  page,
  context,
}) => {
  const urls: string[] = [];
  context.on("request", (request) => urls.push(request.url()));
  await page.goto("/");
  await openBook(page, jekyll.title);
  // The first chapter's heading, after the title page and imprint.
  await expect(page.getByTestId("word")).toHaveText("Story");

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByTestId("word")).not.toHaveText("Story");
  await page.getByRole("button", { name: "Pause" }).click();
  // Two sentences on, so the time left surely drops by whole seconds.
  await page.getByRole("button", { name: "Next sentence" }).click();
  await page.getByRole("button", { name: "Next sentence" }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();

  const read = row(page, jekyll.title);
  await expect(read).toHaveCount(1);
  await expect(read).not.toContainText("Not opened yet");
  await expect(read.getByTestId("book-left")).not.toHaveText(
    formatDuration(bookTimeLeft(jekyll.reading.left, DEFAULT_WPM)),
  );
  await expect(ownRows(page)).toHaveCount(0);

  await page.reload();
  await expect(row(page, jekyll.title)).not.toContainText("Not opened yet");
  const origin = new URL(page.url()).origin;
  expect(urls.filter((url) => new URL(url).origin !== origin)).toEqual([]);
});

test("after one visit, a built-in book never opened opens and plays with the network off", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload();
  await openBook(page, "A Christmas Carol");
  await expect(page.getByTestId("word")).toHaveText("Preface");
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByTestId("word")).not.toHaveText("Preface");
});

test("shows the books saving for offline use, then that the app is ready, and nothing on later visits", async ({
  page,
}) => {
  await page.goto("/");
  const banner = page.locator(".offline-banner");
  await expect(banner).toContainText("Saving books for offline use");
  await expect(banner).toHaveText("Ready to use offline.", {
    timeout: 30_000,
  });
  await page.reload();
  await expect(titles(page)).toHaveCount(BUILT_IN_BOOKS.length);
  // Given a moment to count the saved books.
  await page.waitForTimeout(2000);
  await expect(banner).toHaveCount(0);
});

test("says so when saving the books for offline use fails, rather than saving forever", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "In WebKit the route didn't stop the service worker's download: this test reached \"Ready\" there (#98)",
  );
  // One book's download fails, so the service worker's install fails.
  await context.route("**/books/bram-stoker_dracula.epub*", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await expect(page.locator(".offline-banner")).toHaveText(
    "Couldn't save the books for offline use. Reload the page to try again.",
    { timeout: 30_000 },
  );
});

test("a service worker script that arrives late still ends in ready, not failed", async ({
  page,
  context,
}) => {
  // A slow first download of the worker, as a phone's network may give.
  await context.route("**/sw.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator(".offline-banner")).toHaveText(
    "Ready to use offline.",
    { timeout: 30_000 },
  );
});
