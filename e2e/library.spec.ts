import { expect, test, type Page } from "@playwright/test";
import { timeWords } from "../src/core/durations.ts";
import { parsePaste } from "../src/core/paste.ts";
import { splitText } from "../src/core/text.ts";
import { formatDuration, timeLeft } from "../src/core/timeLeft.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";

// The library (issues #12 and #13, SPEC.md feature 4): texts stay on the
// device, the library lists them most recently opened first with their
// progress, and they can be renamed and deleted. Saved positions:
// e2e/positions.spec.ts.

const first = "Marley was dead: to begin with.\n\nThere is no doubt whatever.";
const second = "Mr. Utterson the lawyer was a man.\n\nHe was never lighted.";

function rows(page: Page) {
  return page.getByRole("list", { name: "Library" }).getByRole("listitem");
}

function titles(page: Page) {
  return rows(page).locator(".book-title");
}

/** Pastes `text` on the Add text screen and saves it into the reader. */
async function save(page: Page, text: string, title?: string): Promise<void> {
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByLabel("Paste text").fill(text);
  if (title !== undefined) await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
}

async function openText(page: Page, title: string): Promise<void> {
  await titles(page).getByText(title, { exact: true }).click();
}

async function backToLibrary(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Readalez" })).toBeVisible();
}

async function rename(page: Page, from: string, to: string): Promise<void> {
  await page.getByRole("button", { name: `Options for ${from}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill(to);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  // The list reloads once the change is stored.
  await expect(titles(page).getByText(to, { exact: true })).toBeVisible();
}

async function remove(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: `Options for ${title}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Delete…" }).click();
  await expect(dialog.getByRole("heading")).toHaveText(`Delete “${title}”?`);
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(dialog).toBeHidden();
  // The list reloads once the change is stored.
  await expect(titles(page).getByText(title, { exact: true })).toHaveCount(0);
}

test("starts empty, and a saved text opens at its first word and is listed", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("No texts yet.")).toBeVisible();
  await save(page, first);
  await expect(page.getByTestId("word")).toHaveText("Marley");
  await backToLibrary(page);
  await expect(titles(page)).toHaveText(["Marley was dead: to begin with."]);
  await page.reload();
  await expect(titles(page)).toHaveText(["Marley was dead: to begin with."]);
});

/** A whole text's time left at the default speed, as the library shows it. */
function wholeTime(text: string): string {
  const timing = timeWords(splitText(parsePaste(text).sections));
  return formatDuration(timeLeft(timing, 0, DEFAULT_WPM).book);
}

test("lists title, author, progress, time left and last opened, by last opened, unopened last", async ({
  page,
}) => {
  const monday = new Date("2026-11-02T10:00:00Z");
  const tuesday = new Date("2026-11-03T10:00:00Z");
  const wednesday = new Date("2026-11-04T10:00:00Z");
  await page.clock.install({ time: new Date("2026-11-02T09:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(monday);
  await save(page, first, "First");
  await backToLibrary(page);
  await page.clock.pauseAt(tuesday);
  await save(page, second, "Second");
  await backToLibrary(page);
  await seedUnopened(page, "Never opened");
  await page.reload();

  const format = (date: Date) =>
    page.evaluate(
      (ms) =>
        new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(ms),
      date.getTime(),
    );
  await expect(titles(page)).toHaveText(["Second", "First", "Never opened"]);
  await expect(rows(page).nth(0)).toContainText("Unknown author");
  await expect(rows(page).nth(0)).toContainText(
    `Opened ${await format(tuesday)}`,
  );
  await expect(rows(page).nth(1)).toContainText(
    `Opened ${await format(monday)}`,
  );
  await expect(rows(page).nth(2)).toContainText("Not opened yet");
  // Nothing read yet: 0% and the whole text's time.
  await expect(rows(page).nth(0).getByTestId("book-progress")).toHaveText("0%");
  await expect(rows(page).nth(0).getByTestId("book-left")).toHaveText(
    wholeTime(second),
  );
  await expect(rows(page).nth(1).getByTestId("book-left")).toHaveText(
    wholeTime(first),
  );
  // A book stored before #13 shows no progress until it's read.
  await expect(rows(page).nth(2).getByTestId("book-progress")).toHaveCount(0);

  await page.clock.pauseAt(wednesday);
  await openText(page, "First");
  await expect(page.getByTestId("word")).toHaveText("Marley");
  await backToLibrary(page);
  await expect(titles(page)).toHaveText(["First", "Second", "Never opened"]);
  await expect(rows(page).nth(0)).toContainText(
    `Opened ${await format(wednesday)}`,
  );
});

test("renaming one text and deleting another both survive a reload", async ({
  page,
}) => {
  await page.goto("/");
  await save(page, first, "First");
  await backToLibrary(page);
  await save(page, second, "Second");
  await backToLibrary(page);

  await rename(page, "First", "A Christmas Carol");
  // Cancel at the confirmation keeps the text.
  await page.getByRole("button", { name: "Options for Second" }).click();
  await page.getByRole("button", { name: "Delete…" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(titles(page)).toHaveText(["Second", "A Christmas Carol"]);
  await remove(page, "Second");
  await expect(titles(page)).toHaveText(["A Christmas Carol"]);

  await page.reload();
  await expect(titles(page)).toHaveText(["A Christmas Carol"]);
});

test("the same text saved twice says it's already there, and Open opens that copy", async ({
  page,
}) => {
  await page.goto("/");
  await save(page, first, "First");
  await backToLibrary(page);
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByLabel("Paste text").fill(first);
  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog", { name: "Already in your library" });
  await expect(dialog).toContainText("“First” is already in your library.");
  await dialog.getByRole("button", { name: "Open" }).click();
  await expect(page.getByTestId("word")).toHaveText("Marley");
  await backToLibrary(page);
  await expect(titles(page)).toHaveText(["First"]);
});

test("the issue's run: two texts, reopen, rename, reload, delete, reload", async ({
  page,
}) => {
  await page.goto("/");
  await save(page, first, "First");
  await backToLibrary(page);
  await save(page, second, "Second");
  await backToLibrary(page);
  await openText(page, "First");
  await expect(page.getByTestId("word")).toHaveText("Marley");
  await backToLibrary(page);
  await rename(page, "Second", "Jekyll");

  await page.reload();
  await expect(titles(page)).toHaveText(["First", "Jekyll"]);
  await remove(page, "Jekyll");
  await page.reload();
  await expect(titles(page)).toHaveText(["First"]);
});

/**
 * Stores a book that was never opened, as later features add them (the
 * built-in books, #17), straight into IndexedDB (`src/ui/storage.ts`).
 */
async function seedUnopened(page: Page, title: string): Promise<void> {
  await page.evaluate(
    (title) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("readalez", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(["books", "texts"], "readwrite");
          tx.objectStore("books").put({
            id: "seeded",
            title,
            author: "Unknown author",
            addedAt: 0,
          });
          tx.objectStore("texts").put({
            id: "seeded",
            sections: [{ paragraphs: [{ kind: "prose", text: "Seeded." }] }],
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    title,
  );
}
