import { expect, test, type Page } from "@playwright/test";
import { timeWords, wordDuration } from "../src/core/durations.ts";
import { storyOfTheDoor } from "../src/core/fixtures/storyOfTheDoor.ts";
import { parsePaste } from "../src/core/paste.ts";
import {
  findPosition,
  positionOf,
  progressPercent,
  type Position,
} from "../src/core/position.ts";
import { SAVE_EVERY_MS } from "../src/ui/useSavePosition.ts";
import { splitText, wordText } from "../src/core/text.ts";
import { formatDuration, timeLeft } from "../src/core/timeLeft.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";
import { openReader, ownRows } from "./helpers.ts";

// Saved reading positions and progress in the library (issue #13, SPEC.md
// features 4 and 7). Playwright's clock drives the reader, so where reading
// stopped is known to the word.

/** Jekyll and Hyde's first chapter (public domain), one paragraph a block. */
const chapter = storyOfTheDoor.paragraphs
  .map((p) => (p.kind === "verse" ? p.lines.join("\n") : p.text))
  .join("\n\n");
const timing = timeWords(splitText(parsePaste(chapter).sections));
const title = parsePaste(chapter).title;

const frameWord = (page: Page) => page.getByTestId("word");
const marked = (page: Page) => page.getByTestId("current-word");
const row = ownRows;

/** The word on screen, from the progress bar, which has a step per word. */
async function wordIndex(page: Page): Promise<number> {
  return Number(await page.getByLabel("Progress").inputValue());
}

/** Milliseconds of reading at the default speed from word `from` to `to`. */
function readingTime(from: number, to: number): number {
  let ms = 0;
  for (let i = from; i < to; i++) ms += wordDuration(timing, i, DEFAULT_WPM);
  return ms;
}

/** The library's progress and time left for word `index`. */
async function expectProgress(page: Page, index: number): Promise<void> {
  await expect(row(page).getByTestId("book-progress")).toHaveText(
    `${progressPercent(index / timing.words.length)}%`,
  );
  await expect(row(page).getByTestId("book-left")).toHaveText(
    formatDuration(timeLeft(timing, index, DEFAULT_WPM).book),
  );
}

async function openBook(page: Page): Promise<void> {
  await row(page).getByText(title, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
}

async function backToLibrary(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Readalez" })).toBeVisible();
}

test("the issue's run: play 20 s, reload while playing, reopen near where it stopped", async ({
  page,
}) => {
  await openReader(page, chapter);
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(20_000);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  const stopped = await wordIndex(page);
  expect(stopped).toBeGreaterThan(40);

  // As iOS might close the app: no pause, no Back.
  await page.reload();
  // The clock runs again after a reload; play is checked at exact times below.
  await page.clock.pauseAt(new Date("2026-01-02T00:00:00Z"));
  await expect(row(page)).toHaveCount(1);
  const progress = await row(page).getByTestId("book-progress").textContent();
  expect(progress).toMatch(/^\d+%$/);

  await openBook(page);
  const saved = await wordIndex(page);
  expect(saved).toBeLessThanOrEqual(stopped);
  expect(readingTime(saved, stopped)).toBeLessThanOrEqual(5000);
  await expect(frameWord(page)).toHaveText(wordText(timing.words[saved]!));
  await expect(marked(page)).toHaveText(wordText(timing.words[saved]!));
  // The library showed that word's progress.
  await backToLibrary(page);
  await expectProgress(page, saved);

  // Play starts at the marked word (SPEC.md feature 7).
  await openBook(page);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(frameWord(page)).toHaveText(wordText(timing.words[saved]!));
  expect(await wordIndex(page)).toBe(saved);
  // Plus less than the next word's time, for frames landing after the end.
  await page.clock.runFor(wordDuration(timing, saved, DEFAULT_WPM, true) + 100);
  await expect(frameWord(page)).toHaveText(wordText(timing.words[saved + 1]!));
});

test("saves every 2 seconds while playing, with no pause or reload", async ({
  page,
}) => {
  await openReader(page, chapter);
  await page.getByRole("button", { name: "Play" }).click();
  // Saves at 2, 4 and 6 s.
  await page.clock.runFor(7000);
  const now = await wordIndex(page);
  await expect
    .poll(async () => {
      const stored = await storedWord(page);
      return stored && findPosition(timing.words, stored as Position);
    })
    .toBeGreaterThan(0);
  const stored = findPosition(
    timing.words,
    (await storedWord(page)) as Position,
  );
  expect(stored).toBeLessThanOrEqual(now);
  // About 1 s of reading, plus the word that was showing at 6 s.
  expect(readingTime(stored, now)).toBeLessThanOrEqual(SAVE_EVERY_MS);
});

test("a place picked while paused is kept by Back and by a reload", async ({
  page,
}) => {
  await openReader(page, chapter);
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(3000);
  await page.getByRole("button", { name: "Pause" }).click();
  // Moves while paused: two sentences on.
  await page.getByRole("button", { name: "Next sentence" }).click();
  await page.getByRole("button", { name: "Next sentence" }).click();
  const picked = await wordIndex(page);

  await backToLibrary(page);
  await expectProgress(page, picked);
  await openBook(page);
  expect(await wordIndex(page)).toBe(picked);

  await page.getByRole("button", { name: "Previous sentence" }).click();
  const before = await wordIndex(page);
  expect(before).toBeLessThan(picked);
  // Saving on a move while paused has no visible sign; this waits for the
  // write the way the app's own reload of the list would.
  await expect
    .poll(() => storedWord(page))
    .toEqual(positionOf(timing.words[before]!));
  await page.reload();
  await openBook(page);
  expect(await wordIndex(page)).toBe(before);
});

test("the last word marks the book finished; Start over clears it", async ({
  page,
}) => {
  const short = "One two three. Four five six.";
  await openReader(page, short);
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(10_000);
  await page.getByRole("button", { name: "Back to library" }).click();
  await expect(row(page).getByTestId("book-progress")).toHaveText("Finished");
  await expect(row(page).getByTestId("book-left")).toHaveCount(0);

  await page.reload();
  await expect(row(page).getByTestId("book-progress")).toHaveText("Finished");
  // A finished book opens on its Finished card.
  await row(page).getByText("One two three. Four five six.").click();
  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible();
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(frameWord(page)).toHaveText("One");
  await backToLibrary(page);
  await expect(row(page).getByTestId("book-progress")).toHaveText("0%");
});

/** The position stored for the only book, read straight from IndexedDB. */
function storedWord(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("readalez");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const get = db.transaction("books").objectStore("books").getAll();
          get.onsuccess = () => {
            db.close();
            resolve(get.result[0]?.reading?.position);
          };
          get.onerror = () => reject(get.error);
        };
      }),
  );
}
