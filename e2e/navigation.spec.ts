import { expect, test, type Page } from "@playwright/test";
import { chapterTexts, wordCount } from "../src/core/chapterText.ts";
import { timeWords, wordDuration } from "../src/core/durations.ts";
import { storyOfTheDoor } from "../src/core/fixtures/storyOfTheDoor.ts";
import { parsePaste } from "../src/core/paste.ts";
import { sentenceStarts } from "../src/core/sentences.ts";
import { splitText, wordText } from "../src/core/text.ts";
import { formatDuration, timeLeft } from "../src/core/timeLeft.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";
import { openReader, stopwatch } from "./helpers.ts";

// The paused view, progress bar, time left and Finished card (issue #11,
// SPEC.md feature 7).

const sentences = "One two three. Four five six. Seven eight nine. Ten.";

/** Jekyll and Hyde's first chapter (public domain), one paragraph a block. */
const chapter = storyOfTheDoor.paragraphs
  .map((p) => (p.kind === "verse" ? p.lines.join("\n") : p.text))
  .join("\n\n");

/** Three paragraphs of the chapter, 73 words. */
const threeParagraphs = chapter.split("\n\n").slice(5, 8).join("\n\n");

/** What the reader makes of a pasted text, worked out by src/core. */
function read(text: string) {
  const { sections } = parsePaste(text);
  const timing = timeWords(splitText(sections));
  return {
    sections,
    timing,
    words: timing.words,
    texts: chapterTexts(sections, timing.words),
    starts: sentenceStarts(timing.words),
  };
}

const frameWord = (page: Page) => page.getByTestId("word");
const marked = (page: Page) => page.getByTestId("current-word");
const pausedText = (page: Page) => page.getByTestId("paused-text");
const playing = (page: Page) =>
  expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
const paused = (page: Page) =>
  expect(page.getByRole("button", { name: "Play" })).toBeVisible();

/** Taps word `index` in the paused view, scrolling to it first. */
async function tapWord(
  page: Page,
  { words, texts }: ReturnType<typeof read>,
  index: number,
): Promise<void> {
  const word = words[index]!;
  const paragraph = texts[word.section]![word.paragraph]!;
  const k = index - paragraph.first;
  const point = await page.evaluate(
    ([number, start, end]) => {
      const p = document.querySelector(
        `[data-testid=paused-text] p[data-paragraph="${number}"]`,
      )!;
      // The paragraph's text can be split around the marked word.
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let seen = 0;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const length = node.textContent!.length;
        if (start >= seen && start < seen + length) {
          range.setStart(node, start - seen);
        }
        if (end > seen && end <= seen + length) range.setEnd(node, end - seen);
        seen += length;
      }
      // Scrolls the pane to the word: a long paragraph can be taller than it.
      const pane = p.closest("[data-testid=paused-text]")!;
      pane.scrollTop +=
        range.getBoundingClientRect().top -
        pane.getBoundingClientRect().top -
        pane.clientHeight / 2;
      const box = range.getClientRects()[0]!;
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    },
    [word.paragraph, paragraph.starts[k]!, paragraph.ends[k]!],
  );
  await page.mouse.click(point.x, point.y);
}

/** Drags the progress bar's thumb from where it is to `fraction` of the way. */
async function dragBar(page: Page, fraction: number): Promise<void> {
  const bar = page.getByLabel("Progress");
  const box = (await bar.boundingBox())!;
  const value = Number(await bar.inputValue());
  const max = Number(await bar.getAttribute("max"));
  // The thumb's centre runs from half a thumb in from each end; 8 px is
  // about half a thumb in both engines (not exact, so tests allow for it).
  const x = (f: number) => box.x + 8 + f * (box.width - 16);
  const y = box.y + box.height / 2;
  await page.mouse.move(x(value / max), y);
  await page.mouse.down();
  await page.mouse.move(x((value / max + fraction) / 2), y, { steps: 5 });
  await page.mouse.move(x(fraction), y, { steps: 5 });
  await page.mouse.up();
}

test("the paused view shows when paused; the frame and Space still toggle", async ({
  page,
}) => {
  await openReader(page, sentences);
  await expect(pausedText(page)).toBeVisible();
  await expect(marked(page)).toHaveText("One");
  await expect(page.getByTestId("book-left")).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await playing(page);
  await expect(pausedText(page)).toBeHidden();
  // While playing the progress bar stays, and time left is hidden.
  await expect(page.getByLabel("Progress")).toBeVisible();
  await expect(page.getByTestId("book-left")).toBeHidden();
  await page.keyboard.press("Space");
  await paused(page);
  await expect(pausedText(page)).toBeVisible();
  await page.keyboard.press("Space");
  await playing(page);
  await page.getByRole("button", { name: "Pause" }).click();
  await paused(page);
  await expect(pausedText(page)).toBeVisible();

  // After a tap in the text, Space plays.
  await tapWord(page, read(sentences), 6);
  await expect(frameWord(page)).toHaveText("Seven");
  await page.keyboard.press("Space");
  await playing(page);
});

test("the paused view marks the current word; a tapped word plays from exactly there", async ({
  page,
}) => {
  const text = read(threeParagraphs);
  await openReader(page, threeParagraphs);
  await expect(marked(page)).toHaveText(wordText(text.words[0]!));
  await page.getByRole("button", { name: "Next sentence" }).click();
  const second = text.starts[1]!;
  await expect(frameWord(page)).toHaveText(wordText(text.words[second]!));
  await expect(marked(page)).toHaveText(wordText(text.words[second]!));

  // A word in the middle of a sentence in the second paragraph.
  const target = text.words.findIndex((w) => w.paragraph === 1) + 3;
  expect(text.starts).not.toContain(target);
  await tapWord(page, text, target);
  await expect(frameWord(page)).toHaveText(wordText(text.words[target]!));
  await expect(marked(page)).toHaveText(wordText(text.words[target]!));

  await page.getByRole("button", { name: "Play" }).click();
  const advanceTo = stopwatch(page);
  const first = wordDuration(text.timing, target, DEFAULT_WPM, true);
  await advanceTo(first - 30);
  await expect(frameWord(page)).toHaveText(wordText(text.words[target]!));
  await advanceTo(first + 30);
  await expect(frameWord(page)).toHaveText(wordText(text.words[target + 1]!));

  // Play after a pause starts at the word on screen too.
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(frameWord(page)).toHaveText(wordText(text.words[target + 1]!));
});

test("dragging the progress bar to the middle lands on a sentence start near the middle", async ({
  page,
}) => {
  const text = read(chapter);
  await openReader(page, chapter);
  await dragBar(page, 0.5);

  const bar = page.getByLabel("Progress");
  await expect(bar).not.toHaveValue("0");
  const value = Number(await bar.inputValue());
  expect(text.starts).toContain(value);
  const middle = (text.words.length - 1) / 2;
  expect(Math.abs(value - middle)).toBeLessThan(text.words.length * 0.05);
  await expect(frameWord(page)).toHaveText(wordText(text.words[value]!));
  await expect(marked(page)).toHaveText(wordText(text.words[value]!));
  await expect(marked(page)).toBeInViewport();
  await paused(page);
});

test("dragging while playing keeps playing from the sentence start", async ({
  page,
}) => {
  const text = read(chapter);
  await openReader(page, chapter);
  await page.getByRole("button", { name: "Play" }).click();
  await dragBar(page, 0.5);
  const value = Number(await page.getByLabel("Progress").inputValue());
  expect(text.starts).toContain(value);
  await expect(frameWord(page)).toHaveText(wordText(text.words[value]!));
  await playing(page);
});

test("time left for the chapter and the book matches #7's time left", async ({
  page,
}) => {
  const text = read(chapter);
  await openReader(page, chapter);
  const expectTimeLeft = async (index: number, wpm: number) => {
    const left = timeLeft(text.timing, index, wpm);
    await expect(page.getByTestId("chapter-left")).toHaveText(
      formatDuration(left.chapter),
    );
    await expect(page.getByTestId("book-left")).toHaveText(
      formatDuration(left.book),
    );
  };

  await expectTimeLeft(0, DEFAULT_WPM);
  await page.getByRole("button", { name: "Next sentence" }).click();
  await page.getByRole("button", { name: "Next sentence" }).click();
  await expectTimeLeft(text.starts[2]!, DEFAULT_WPM);
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowUp");
  await expectTimeLeft(text.starts[2]!, 330);
  for (let i = 0; i < 33; i++) await page.keyboard.press("ArrowUp");
  await expectTimeLeft(text.starts[2]!, 660);
});

test("the last word leads to the Finished card; Start over and Back to library", async ({
  page,
}) => {
  const text = read(sentences);
  await openReader(page, sentences);
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(10_000);
  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible();
  await expect(page.getByTestId("word-count")).toHaveText(
    `${wordCount(text.sections)} words`,
  );
  expect(wordCount(text.sections)).toBe(10);
  // Keys do nothing on the card.
  await page.keyboard.press("Space");
  await page.clock.runFor(1000);
  await expect(page.getByRole("heading", { name: "Finished" })).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(frameWord(page)).toHaveText("One");
  await expect(marked(page)).toHaveText("One");
  await paused(page);

  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(10_000);
  await page.getByRole("button", { name: "Back to library" }).click();
  await expect(page.getByLabel("Paste text")).toBeVisible();
});

test("the issue's run: pause, tap a word two paragraphs on, drag to the end, finish", async ({
  page,
}) => {
  const text = read(threeParagraphs);
  await openReader(page, threeParagraphs);
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(1500);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(pausedText(page)).toBeVisible();
  const shown = await frameWord(page).textContent();
  await expect(marked(page)).toHaveText(shown!);

  // Two paragraphs on, mid-sentence.
  const target = text.words.findIndex((w) => w.paragraph === 2) + 4;
  expect(text.starts).not.toContain(target);
  await tapWord(page, text, target);
  await page.getByRole("button", { name: "Play" }).click();
  await expect(frameWord(page)).toHaveText(wordText(text.words[target]!));
  await page.getByRole("button", { name: "Pause" }).click();

  await dragBar(page, 1);
  const last = text.starts.at(-1)!;
  await expect(page.getByLabel("Progress")).toHaveValue(String(last));
  await page.getByRole("button", { name: "Play" }).click();
  await page.clock.runFor(20_000);
  await expect(page.getByTestId("word-count")).toHaveText(
    `${wordCount(text.sections)} words`,
  );
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(frameWord(page)).toHaveText(wordText(text.words[0]!));
});

test.describe("with a novel's worth of text", () => {
  // About 1 MB: the chapter many times over, as in the issue's device check.
  const novel = Array.from({ length: 80 }, () => chapter).join("\n\n");
  test.setTimeout(120_000);

  test("the paused view opens, follows the bar and takes taps deep in the text", async ({
    page,
  }) => {
    expect(novel.length).toBeGreaterThan(1_000_000);
    const text = read(novel);
    await openReader(page, novel);
    await expect(marked(page)).toHaveText(wordText(text.words[0]!));

    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.runFor(1000);
    const before = Date.now();
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(marked(page)).toBeVisible();
    console.log(
      `${test.info().project.name}: paused view of ${text.words.length} words opened in ${Date.now() - before} ms`,
    );

    await dragBar(page, 0.75);
    const value = Number(await page.getByLabel("Progress").inputValue());
    expect(value).toBeGreaterThan(text.words.length * 0.7);
    await expect(marked(page)).toHaveText(wordText(text.words[value]!));
    await expect(marked(page)).toBeInViewport();

    const target = value + 40;
    await tapWord(page, text, target);
    await expect(frameWord(page)).toHaveText(wordText(text.words[target]!));
  });
});

test("the bar follows the word again after a drag let go where it started", async ({
  page,
}) => {
  await openReader(page, sentences);
  const bar = page.getByLabel("Progress");
  const box = (await bar.boundingBox())!;
  const y = box.y + box.height / 2;
  // From the thumb at 0 to the middle and back before letting go: the value
  // ends where it started, so the browser fires no change event.
  await page.mouse.move(box.x + 8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, y, { steps: 5 });
  await page.mouse.move(box.x + 8, y, { steps: 5 });
  await page.mouse.up();
  await expect(bar).toHaveValue("0");

  await page.getByRole("button", { name: "Next sentence" }).click();
  await expect(frameWord(page)).toHaveText("Four");
  await expect(bar).toHaveValue("3");
});

test("tapping the start of a word right after a dash picks that word", async ({
  page,
}) => {
  const text = "Alpha beta yes—nothing more here.";
  await openReader(page, text);
  const point = await page.evaluate(() => {
    const p = document.querySelector("[data-testid=paused-text] p")!;
    const node = [...p.childNodes].find((n) =>
      n.textContent!.includes("nothing"),
    )!;
    const range = document.createRange();
    const at = node.textContent!.indexOf("nothing");
    range.setStart(node, at);
    range.setEnd(node, at + 1);
    const box = range.getBoundingClientRect();
    return { x: box.left + 1, y: box.top + box.height / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await expect(frameWord(page)).toHaveText("nothing");
});

test.describe("without caretPositionFromPoint, as in Safari before 26.2", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      delete (Document.prototype as Partial<Document>).caretPositionFromPoint;
    });
  });

  test("a tapped word still moves the frame", async ({ page }) => {
    const text = read(threeParagraphs);
    await openReader(page, threeParagraphs);
    expect(
      await page.evaluate(() => "caretPositionFromPoint" in document),
    ).toBe(false);
    const target = text.words.findIndex((w) => w.paragraph === 2) + 4;
    await tapWord(page, text, target);
    await expect(frameWord(page)).toHaveText(wordText(text.words[target]!));
  });
});
