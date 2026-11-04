import { expect, test, type Page } from "@playwright/test";
import { timeWords, wordDuration } from "../src/core/durations.ts";
import { storyOfTheDoor } from "../src/core/fixtures/storyOfTheDoor.ts";
import { parsePaste } from "../src/core/paste.ts";
import { splitText, wordText } from "../src/core/text.ts";
import { DEFAULT_WPM } from "../src/core/timingValues.ts";

// The first reader (issue #8): paste, open, tap the frame to play on #7's
// schedule. Playwright's clock drives requestAnimationFrame and
// performance.now(), so word changes are checked at exact times.

/** Three paragraphs of Jekyll and Hyde (public domain), 73 words. */
const threeParagraphs = storyOfTheDoor.paragraphs
  .slice(5, 8)
  .map((p) => (p.kind === "verse" ? p.lines.join("\n") : p.text))
  .join("\n\n");

/**
 * Moves the paused clock on to `at` ms after it was made, so a test can
 * check what shows at times counted from the tap that started playing.
 */
function stopwatch(page: Page): (at: number) => Promise<void> {
  let now = 0;
  return async (at) => {
    await page.clock.runFor(at - now);
    now = at;
  };
}

/** Opens the reader on `text` with the page's clock paused. */
async function openReader(page: Page, text: string): Promise<void> {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.getByLabel("Paste text").fill(text);
  await page.getByRole("button", { name: "Save" }).click();
}

interface Measures {
  focus: number;
  ticks: number[];
  fontSize: number;
  word: { left: number; right: number };
  frame: { left: number; right: number };
}

/** Centres of the focus letter and the ticks, and the word's extent. */
function measure(page: Page): Promise<Measures> {
  return page.evaluate(() => {
    const rect = (testId: string) =>
      document
        .querySelector(`[data-testid=${testId}]`)!
        .getBoundingClientRect();
    const centre = (r: DOMRect) => r.left + r.width / 2;
    const before = document.querySelector(".before")!.getBoundingClientRect();
    const after = document.querySelector(".after")!.getBoundingClientRect();
    const line = document.querySelector(".frame-line")!.getBoundingClientRect();
    return {
      focus: centre(rect("focus")),
      ticks: [...document.querySelectorAll("[data-testid=tick]")].map((t) =>
        centre(t.getBoundingClientRect()),
      ),
      fontSize: parseFloat(
        getComputedStyle(document.querySelector("[data-testid=word]")!)
          .fontSize,
      ),
      word: { left: before.left, right: after.right },
      frame: { left: line.left, right: line.right },
    };
  });
}

test("shows the first word after pasting and opening the reader", async ({
  page,
}) => {
  await openReader(
    page,
    "Marley was dead: to begin with.\n\nThere is no doubt.",
  );
  await expect(page.getByTestId("word")).toHaveText("Marley");
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
});

test("tapping the frame plays and pauses at #7's durations", async ({
  page,
}) => {
  await openReader(page, "Hello there, friend. Go on.");
  const word = page.getByTestId("word");
  await page.getByRole("button", { name: "Play" }).click();
  const advanceTo = stopwatch(page);
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  // At 300 wpm: the first word 1.5× (300 ms), a comma 1.5× (300 ms), a
  // sentence end 2× (400 ms). Each change is checked 30 ms before and after.
  for (const [at, text] of [
    [270, "Hello"],
    [330, "there,"],
    [570, "there,"],
    [630, "friend."],
    [970, "friend."],
    [1030, "Go"],
  ] as const) {
    await advanceTo(at);
    await expect(word).toHaveText(text);
  }

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  await page.clock.runFor(2000);
  await expect(word).toHaveText("Go");
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`in the ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test("plays three paragraphs in order with the focus letter on a fixed spot", async ({
      page,
    }) => {
      const timing = timeWords(splitText(parsePaste(threeParagraphs).sections));
      expect(timing.words.length).toBeGreaterThanOrEqual(50);
      await openReader(page, threeParagraphs);

      const background = await page.evaluate(
        () => getComputedStyle(document.documentElement).backgroundColor,
      );
      expect(background).toBe(
        colorScheme === "light" ? "rgb(255, 255, 255)" : "rgb(18, 18, 18)",
      );

      const word = page.getByTestId("word");
      await page.getByRole("button", { name: "Play" }).click();
      const advanceTo = stopwatch(page);
      const durations: number[] = [];
      const centres: number[] = [];
      let frame = { left: 0, right: 0 };
      let start = 0;
      for (let i = 0; i < timing.words.length; i++) {
        const duration = wordDuration(timing, i, DEFAULT_WPM, i === 0);
        // Shown from just after its start to just before its end.
        for (const at of [start + 30, start + duration - 30]) {
          await advanceTo(at);
          await expect(word).toHaveText(wordText(timing.words[i]!));
        }
        const measures = await measure(page);
        centres.push(measures.focus, ...measures.ticks);
        frame = measures.frame;
        durations.push(duration);
        start += duration;
      }

      // Every centre sits on the focus point, 40% of the way across.
      const point = frame.left + 0.4 * (frame.right - frame.left);
      for (const centre of centres) {
        expect(Math.abs(centre - point)).toBeLessThanOrEqual(1);
      }

      // Paragraph ends pause longer than sentence ends.
      const ends = timing.words.flatMap((w, i) => (w.end ? [i] : []));
      expect(ends).toHaveLength(3);
      const paragraphEnd = durations[ends[0]!]!;
      const sentenceEnd =
        durations[timing.words.findIndex((w) => wordText(w) === "door?”")];
      expect(sentenceEnd).toBeGreaterThan(durations[1]!);
      expect(paragraphEnd).toBeGreaterThan(sentenceEnd!);

      // Reading stops on the last word. Until the Finished card (#11), a tap
      // starts again from the first word, and tapping again pauses there.
      await advanceTo(start + 100);
      await expect(word).toHaveText(wordText(timing.words.at(-1)!));
      await page.getByRole("button", { name: "Play" }).click();
      await expect(word).toHaveText(wordText(timing.words[0]!));
      await page.clock.runFor(wordDuration(timing, 0, DEFAULT_WPM, true) + 100);
      await expect(word).toHaveText(wordText(timing.words[1]!));
      await page.getByRole("button", { name: "Pause" }).click();
      await page.clock.runFor(5000);
      await expect(word).toHaveText(wordText(timing.words[1]!));
    });
  });
}

test.describe("in a narrow viewport", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("a word too wide for the frame shrinks to fit, whole", async ({
    page,
  }) => {
    await openReader(page, "comprehension WWWWWWWWWWWWW,”");
    const word = page.getByTestId("word");

    await expect(word).toHaveText("comprehension");
    const normal = await measure(page);
    // A 13-letter word fits at the default size (2.25rem) in this 375 × 667 viewport.
    expect(normal.fontSize).toBe(36);
    expect(normal.word.left).toBeGreaterThanOrEqual(normal.frame.left);
    expect(normal.word.right).toBeLessThanOrEqual(normal.frame.right);

    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.runFor(700);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect(word).toHaveText("WWWWWWWWWWWWW,”");
    const wide = await measure(page);
    expect(wide.fontSize).toBeLessThan(normal.fontSize);
    expect(wide.word.left).toBeGreaterThanOrEqual(wide.frame.left);
    expect(wide.word.right).toBeLessThanOrEqual(wide.frame.right);
    expect(Math.abs(wide.focus - normal.focus)).toBeLessThanOrEqual(1);
  });
});
