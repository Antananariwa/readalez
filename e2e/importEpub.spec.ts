import { expect, test, type Page } from "@playwright/test";
import { testEpub } from "../src/core/epub/testZip.ts";
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
  // Stored before the next import loads the page again. In one full run on
  // #15's branch, the reload came first and no dialog showed.
  await expect(rows(page).locator(".book-title")).toHaveText([
    "A Christmas Carol",
  ]);
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

/** Picks an EPUB made in the test on the Add text screen. */
async function importBytes(page: Page, bytes: Uint8Array) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import EPUB" }).click();
  await (
    await chooser
  ).setFiles({
    name: "book.epub",
    mimeType: "application/epub+zip",
    buffer: Buffer.from(bytes),
  });
}

const CHAPTER = { "one.xhtml": "<h1>One</h1><p>It was a dark night.</p>" };

test("a copy-protected EPUB shows the DRM message and adds nothing", async ({
  page,
}) => {
  await goToAddText(page);
  await importBytes(
    page,
    testEpub({
      documents: CHAPTER,
      files: {
        "META-INF/encryption.xml": `<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#">
<enc:EncryptedData>
  <enc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
  <enc:CipherData><enc:CipherReference URI="OEBPS/one.xhtml"/></enc:CipherData>
</enc:EncryptedData>
</encryption>`,
      },
    }),
  );
  await expect(page.getByRole("status")).toHaveText(
    "This book is copy-protected (DRM), so Readalez can't open it.",
  );

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("No texts yet.")).toBeVisible();
});

test("an EPUB with a damaged file inside shows a message and adds nothing", async ({
  page,
}) => {
  const bytes = testEpub({ documents: CHAPTER });
  // One byte of the chapter's text, changed after its CRC-32 was written.
  const at = Buffer.from(bytes).indexOf("dark night");
  bytes[at] = "D".charCodeAt(0);

  await goToAddText(page);
  await importBytes(page, bytes);
  await expect(page.getByRole("status")).toHaveText("Couldn't read this EPUB.");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("No texts yet.")).toBeVisible();
});

test("a 600,000-word EPUB shows a moving progress bar, then lands in the library marked New", async ({
  page,
}) => {
  test.setTimeout(180_000);
  // 60 chapters of 100 paragraphs of 100 words: about the length of War and
  // Peace (SPEC.md feature 2).
  const sentence = "The old house stood quiet at the end of the lane.";
  const paragraph = `<p>${Array(10).fill(sentence).join(" ")}</p>`;
  const documents: Record<string, string> = {};
  for (let n = 1; n <= 60; n++) {
    documents[`c${n}.xhtml`] = `<h1>Chapter ${n}</h1>` + paragraph.repeat(100);
  }
  const bytes = testEpub({
    metadata: "<dc:title>A Long Book</dc:title>",
    documents,
  });

  await goToAddText(page);
  await importBytes(page, bytes);
  const bar = page.getByRole("progressbar", { name: "Importing…" });
  await expect(bar).toBeVisible();
  // Seen part of the way through, so the bar moved before the end.
  await expect
    .poll(() => bar.evaluate((el: HTMLProgressElement) => el.value / el.max))
    .toBeGreaterThan(0.1);

  await expect(rows(page).locator(".book-title")).toHaveText(["A Long Book"], {
    timeout: 120_000,
  });
  await expect(rows(page).getByText("New", { exact: true })).toBeVisible();
});
