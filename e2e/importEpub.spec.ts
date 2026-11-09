import { expect, test, type Page } from "@playwright/test";
import { goToAddText } from "./helpers.ts";

// EPUB import (issue #14, SPEC.md feature 2): Import EPUB opens the file
// picker, and the book picked is added with its metadata and shown in the
// library, marked New until you leave the library or reload.

const CAROL = new URL(
  "../tests/fixtures/epub/standard-ebooks-a-christmas-carol.epub",
  import.meta.url,
).pathname;

async function importCarol(page: Page) {
  await goToAddText(page);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (await chooser).setFiles(CAROL);
}

const rows = (page: Page) =>
  page.getByRole("list", { name: "Library" }).getByRole("listitem");

test("imports an EPUB into the library with its title and author, marked New until a reload", async ({
  page,
}) => {
  await importCarol(page);

  const row = rows(page);
  await expect(row.locator(".book-title")).toHaveText(["A Christmas Carol"]);
  await expect(row.locator(".book-author")).toHaveText(["Charles Dickens"]);
  await expect(row.getByText("New", { exact: true })).toBeVisible();

  await page.reload();
  await expect(row.locator(".book-title")).toHaveText(["A Christmas Carol"]);
  await expect(row.getByText("New", { exact: true })).toHaveCount(0);
});

test("the New mark goes once the book is opened", async ({ page }) => {
  await importCarol(page);
  await rows(page).locator(".book").click();

  // Where the author's text starts: the preface, after the title page and
  // imprint (#15).
  await expect(page.getByTestId("word")).toHaveText("Preface");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(rows(page).locator(".book-title")).toHaveText([
    "A Christmas Carol",
  ]);
  await expect(rows(page).getByText("New", { exact: true })).toHaveCount(0);
});

test("the New mark goes when you leave the library for Add text", async ({
  page,
}) => {
  await importCarol(page);
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(rows(page).locator(".book-title")).toHaveText([
    "A Christmas Carol",
  ]);
  await expect(rows(page).getByText("New", { exact: true })).toHaveCount(0);
});

test("importing a book already in the library says so, and offers to open that copy", async ({
  page,
}) => {
  await importCarol(page);
  await importCarol(page);

  const dialog = page.getByRole("dialog", { name: "Already in your library" });
  await expect(dialog).toContainText(
    "“A Christmas Carol” is already in your library. You haven't started it yet.",
  );
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Add text" })).toBeVisible();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (await chooser).setFiles(CAROL);
  await dialog.getByRole("button", { name: "Open" }).click();
  await expect(page.getByTestId("word")).toHaveText("Preface");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(rows(page).locator(".book-title")).toHaveText([
    "A Christmas Carol",
  ]);
  await expect(rows(page).getByText("New", { exact: true })).toHaveCount(0);
});

test("a file that isn't an EPUB shows a message and adds nothing", async ({
  page,
}) => {
  await goToAddText(page);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (
    await chooser
  ).setFiles({
    name: "notes.epub",
    mimeType: "application/epub+zip",
    buffer: Buffer.from("Just some text."),
  });
  await expect(page.getByRole("status")).toHaveText("Couldn't read this EPUB.");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("No texts yet.")).toBeVisible();
});
