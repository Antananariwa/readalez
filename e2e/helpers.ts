import type { Page } from "@playwright/test";

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

/** Opens the reader on `text` with the page's clock paused. */
export async function openReader(page: Page, text: string): Promise<void> {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.getByLabel("Paste text").fill(text);
  await page.getByRole("button", { name: "Save" }).click();
}
