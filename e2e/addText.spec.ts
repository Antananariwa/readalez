import { expect, test } from "@playwright/test";
import { gutenbergChapter } from "../src/core/fixtures/gutenbergChapter.ts";

// The Add text screen (issue #9, SPEC.md feature 1): the suggested title,
// editing it, and saving into the reader.

test("suggests a title, lets it be edited, and saves into the reader", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.getByLabel("Title");
  await page
    .getByLabel("Paste text")
    .fill("Marley was dead: to begin with.\nThere is no doubt whatever.");
  await expect(title).toHaveValue("Marley was dead: to begin with.");

  await title.fill("A Christmas Carol");
  await page.getByLabel("Paste text").fill("Marley was dead.\nNo doubt.");
  await expect(title).toHaveValue("A Christmas Carol");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("word")).toHaveText("Marley");
});

test("a Gutenberg chapter opens at its first word, not in the license", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Paste text").fill(gutenbergChapter);
  await expect(page.getByLabel("Title")).toHaveValue("Story of the Door");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("word")).toHaveText("Story");
});
