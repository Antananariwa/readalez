import { expect, test } from "@playwright/test";
import { goToAddText } from "./helpers.ts";

// EPUB import (issue #14, SPEC.md feature 2): Import EPUB opens the file
// picker, and the book picked is added with its metadata and opened.

const CAROL = new URL(
  "../tests/fixtures/epub/standard-ebooks-a-christmas-carol.epub",
  import.meta.url,
).pathname;

test("imports an EPUB into the library with its title and author, and opens it", async ({
  page,
}) => {
  await goToAddText(page);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (await chooser).setFiles(CAROL);

  // Until #15, a book opens at the start of its spine: the titlepage.
  await expect(page.getByTestId("word")).toHaveText("A");

  await page.getByRole("button", { name: "Back" }).click();
  const row = page.getByRole("list", { name: "Library" }).getByRole("listitem");
  await expect(row.locator(".book-title")).toHaveText(["A Christmas Carol"]);
  await expect(row.locator(".book-author")).toHaveText(["Charles Dickens"]);

  await page.reload();
  await expect(row.locator(".book-title")).toHaveText(["A Christmas Carol"]);
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
