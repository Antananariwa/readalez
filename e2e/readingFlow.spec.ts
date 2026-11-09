import { expect, test, type Page } from "@playwright/test";
import { goToAddText } from "./helpers.ts";

// The reading flow and the chapter list (issue #15, SPEC.md features 2 and
// 7), on Gutenberg's Alice: Gutenberg's header, the title page and the
// contents come before CHAPTER I, and its footer and license after THE END.

const ALICE = new URL(
  "../tests/fixtures/epub/gutenberg-11-alice-in-wonderland-epub3.epub",
  import.meta.url,
).pathname;

const frameWord = (page: Page) => page.getByTestId("word");
const chapterList = (page: Page) =>
  page.getByRole("dialog", { name: "Chapters" });

/** Imports Alice, then opens it from the library with the clock paused. */
async function openAlice(page: Page) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await goToAddText(page);
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (await chooser).setFiles(ALICE);
  await page
    .getByRole("list", { name: "Library" })
    .getByRole("listitem")
    .locator(".book")
    .click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
}

async function pick(page: Page, title: string) {
  await page.getByRole("button", { name: "Chapters" }).click();
  await chapterList(page).getByRole("button", { name: title }).click();
  await expect(chapterList(page)).toBeHidden();
}

test("a book opens where the author's text starts, with 0% progress", async ({
  page,
}) => {
  await openAlice(page);
  await expect(frameWord(page)).toHaveText("CHAPTER");
  await expect(page.getByTestId("paused-text")).toContainText(
    "Alice was beginning to get very tired",
  );
  await expect(page.getByTestId("paused-text")).not.toContainText("Contents");
  await expect(page.getByLabel("Progress")).toHaveAttribute(
    "aria-valuetext",
    "0%",
  );
});

test("the chapter list shows the skipped front matter, the chapters and the license, and jumps", async ({
  page,
}) => {
  await openAlice(page);
  await page.getByRole("button", { name: "Chapters" }).click();
  const list = chapterList(page);
  await expect(list.getByRole("button")).toContainText([
    "The Project Gutenberg eBook of Alice's Adventures in · skipped",
    "Alice’s Adventures in Wonderland · skipped",
    "THE MILLENNIUM FULCRUM EDITION 3.0 · skipped",
    "Contents · skipped",
    "CHAPTER I. Down the Rabbit-Hole",
  ]);
  await expect(
    list.getByRole("button", { name: "THE FULL PROJECT GUTENBERG™ LICENSE" }),
  ).toContainText("skipped");
  await expect(list.locator("[aria-current]")).toHaveText(
    "CHAPTER I. Down the Rabbit-Hole",
  );
  await list.getByRole("button", { name: "Close" }).click();

  await pick(page, "CHAPTER VII. A Mad Tea-Party");
  await expect(frameWord(page)).toHaveText("CHAPTER");
  await expect(page.getByTestId("paused-text")).toContainText(
    "A Mad Tea-Party",
  );
  // The paused view shows that chapter only.
  await expect(page.getByTestId("paused-text")).not.toContainText(
    "Pig and Pepper",
  );
});

test("the last chapter reads to the Finished card, before the license", async ({
  page,
}) => {
  await openAlice(page);
  await pick(page, "CHAPTER XII. Alice’s Evidence");
  // To the end of the bar, which covers the reading flow only.
  await page.getByLabel("Progress").focus();
  await page.keyboard.press("End");
  await expect(page.getByTestId("paused-text")).toContainText("THE END");
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(60_000);
  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible();
});

test("playing a skipped part reads it to its end and stops there", async ({
  page,
}) => {
  await openAlice(page);
  await pick(page, "Contents · skipped");
  await expect(frameWord(page)).toHaveText("Contents");
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(120_000);
  // The contents' last row, "CHAPTER XII. Alice’s Evidence", ends the part.
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await expect(frameWord(page)).toHaveText("Evidence");
  await expect(page.getByRole("heading", { name: "Finished" })).toBeHidden();
  await expect(page.getByLabel("Progress")).toHaveAttribute(
    "aria-valuetext",
    "0%",
  );
});
