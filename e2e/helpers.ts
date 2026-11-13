import { expect, type Locator, type Page } from "@playwright/test";

// Helpers shared by the reader's tests. Playwright's clock drives
// requestAnimationFrame and performance.now(), so word changes are checked
// at exact times.

/**
 * Moves the paused clock on to `at` ms after it was made, so a test can
 * check what shows at times counted from the tap that started playing.
 */
export function stopwatch(page: Page): (at: number) => Promise<void> {
  let now = 0;
  return async (at) => {
    await page.clock.runFor(at - now);
    now = at;
  };
}

/** Opens the library, then the Add text screen. */
export async function goToAddText(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Add text" }).click();
}

/** Opens the reader on `text` with the page's clock paused. */
export async function openReader(page: Page, text: string): Promise<void> {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByLabel("Paste text").fill(text);
  await page.getByRole("button", { name: "Save" }).click();
  // Saving stores the text first, so the reader opens a moment later.
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
}

/**
 * The library's rows for your own books, leaving out the built-in books
 * listed from the first visit (SPEC.md feature 3): those have no options
 * button, since they can't be renamed or deleted.
 */
export function ownRows(page: Page): Locator {
  return page
    .getByRole("list", { name: "Library" })
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /^Options for / }) });
}
