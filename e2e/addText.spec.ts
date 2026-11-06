import { expect, test } from "@playwright/test";
import { timeWords, wordDuration } from "../src/core/durations.ts";
import {
  chapterParagraphs,
  gutenbergChapter,
  wrap,
} from "../src/core/fixtures/gutenbergChapter.ts";
import { splitText, wordText } from "../src/core/text.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";
import { splitWords } from "../src/core/words.ts";
import { goToAddText } from "./helpers.ts";

// The Add text screen (issue #9, SPEC.md feature 1): the suggested title,
// editing it, and saving into the reader.

test("suggests a title, lets it be edited, and saves into the reader", async ({
  page,
}) => {
  await goToAddText(page);
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
  await goToAddText(page);
  await page.getByLabel("Paste text").fill(gutenbergChapter);
  await expect(page.getByLabel("Title")).toHaveValue("Story of the Door");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("word")).toHaveText("Story");
});

test("a Gutenberg chapter pauses at paragraph ends only, not at line wraps", async ({
  page,
}) => {
  // Expected timing from the chapter's original paragraphs, not the paste.
  const timing = timeWords(
    splitText([
      {
        paragraphs: chapterParagraphs.map((text) => ({ kind: "prose", text })),
      },
    ]),
  );
  // Play through the heading and past the first wrapped line's last word.
  const firstLine = splitWords(wrap(chapterParagraphs[1]!, 70)[0]!);
  const lineEnd =
    timing.words.findIndex((w) => w.paragraph === 1) + firstLine.length - 1;
  const last = lineEnd + 1;
  expect(timing.words[lineEnd]!.end).toBeNull();
  expect(wordText(timing.words[lineEnd]!)).toBe(firstLine.at(-1));

  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.getByRole("button", { name: "Add text" }).click();
  await page.getByLabel("Paste text").fill(gutenbergChapter);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Play" }).click();

  const word = page.getByTestId("word");
  let now = 0;
  let start = 0;
  for (let i = 0; i <= last; i++) {
    const duration = wordDuration(timing, i, DEFAULT_WPM, i === 0);
    for (const at of [start + 30, start + duration - 30]) {
      await page.clock.runFor(at - now);
      now = at;
      await expect(word).toHaveText(wordText(timing.words[i]!));
    }
    start += duration;
  }
});
