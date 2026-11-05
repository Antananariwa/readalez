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

// The reader controls (issue #10, SPEC.md feature 7): moving by a sentence,
// the speed, desktop keys, resuming at the sentence start, pausing when the
// page is hidden, and the screen wake lock.
test.describe("controls", () => {
  const sentences = "One two three. Four five six. Seven eight nine. Ten.";
  const word = (page: Page) => page.getByTestId("word");
  const speed = (page: Page) => page.getByTestId("speed");
  const playing = (page: Page) =>
    expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  const paused = (page: Page) =>
    expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  /**
   * Stands in for the page being hidden and shown again, as when the app
   * goes to the background or the screen locks.
   */
  function setVisibility(page: Page, state: "hidden" | "visible") {
    return page.evaluate((state) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
      });
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => state === "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state);
  }

  test("tapping the frame and pressing Space each play and pause", async ({
    page,
  }) => {
    await openReader(page, sentences);
    await page.getByRole("button", { name: "Play" }).click();
    await playing(page);
    await page.keyboard.press("Space");
    await paused(page);
    await page.keyboard.press("Space");
    await playing(page);
    await page.getByRole("button", { name: "Pause" }).click();
    await paused(page);
    // With the frame focused, Space still toggles only once.
    await page.getByRole("button", { name: "Play" }).focus();
    await page.keyboard.press("Space");
    await playing(page);
    await page.keyboard.press("Space");
    await paused(page);
  });

  test("play after a pause starts at the sentence's first word", async ({
    page,
  }) => {
    await openReader(page, sentences);
    await page.getByRole("button", { name: "Play" }).click();
    const advanceTo = stopwatch(page);
    // At 300 wpm: "One" 300 ms, "two" 200, "three." 400, "Four" 200, "five" 200.
    await advanceTo(1200);
    await expect(word(page)).toHaveText("five");
    await page.getByRole("button", { name: "Pause" }).click();
    await page.getByRole("button", { name: "Play" }).click();
    await expect(word(page)).toHaveText("Four");
  });

  test("buttons and arrow keys move by a sentence and change the speed", async ({
    page,
  }) => {
    await openReader(page, sentences);
    const next = page.getByRole("button", { name: "Next sentence" });
    const previous = page.getByRole("button", { name: "Previous sentence" });

    await next.click();
    await expect(word(page)).toHaveText("Four");
    await page.keyboard.press("ArrowRight");
    await expect(word(page)).toHaveText("Seven");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    // No sentence after the last.
    await expect(word(page)).toHaveText("Ten.");
    await previous.click();
    await expect(word(page)).toHaveText("Seven");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(word(page)).toHaveText("One");

    await expect(speed(page)).toHaveText("300 wpm");
    await page.getByRole("button", { name: "Faster" }).click();
    await expect(speed(page)).toHaveText("310 wpm");
    await page.keyboard.press("ArrowUp");
    await expect(speed(page)).toHaveText("320 wpm");
    await page.getByRole("button", { name: "Slower" }).click();
    await page.keyboard.press("ArrowDown");
    await expect(speed(page)).toHaveText("300 wpm");

    for (let i = 0; i < 25; i++) await page.keyboard.press("ArrowDown");
    await expect(speed(page)).toHaveText("100 wpm");
    for (let i = 0; i < 95; i++) await page.keyboard.press("ArrowUp");
    await expect(speed(page)).toHaveText("1000 wpm");
  });

  test("moving while playing keeps playing from the sentence start", async ({
    page,
  }) => {
    await openReader(page, sentences);
    await page.getByRole("button", { name: "Play" }).click();
    await page.keyboard.press("ArrowRight");
    const advanceTo = stopwatch(page);
    await expect(word(page)).toHaveText("Four");
    await playing(page);
    // "Four" is the first word after the jump: 1.5× (300 ms).
    await advanceTo(270);
    await expect(word(page)).toHaveText("Four");
    await advanceTo(330);
    await expect(word(page)).toHaveText("five");
  });

  test("a faster speed applies from the next word", async ({ page }) => {
    await openReader(page, sentences);
    for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowUp");
    await expect(speed(page)).toHaveText("600 wpm");
    await page.getByRole("button", { name: "Play" }).click();
    const advanceTo = stopwatch(page);
    // At 600 wpm: "One" 150 ms, "two" 100 ms.
    await advanceTo(180);
    await expect(word(page)).toHaveText("two");
    await advanceTo(280);
    await expect(word(page)).toHaveText("three.");
  });

  test("hiding the page pauses, and it stays paused", async ({ page }) => {
    await openReader(page, sentences);
    await page.getByRole("button", { name: "Play" }).click();
    await page.clock.runFor(400);
    await expect(word(page)).toHaveText("two");
    await setVisibility(page, "hidden");
    await paused(page);
    await setVisibility(page, "visible");
    await page.clock.runFor(3000);
    await paused(page);
    await expect(word(page)).toHaveText("two");
  });

  test("playing holds a screen wake lock, and pausing releases it", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const calls: string[] = [];
      Object.assign(window, { wakeLockCalls: calls });
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: {
          request: async (type: string) => {
            calls.push(`request ${type}`);
            return {
              release: async () => {
                calls.push("release");
              },
            };
          },
        },
      });
    });
    await openReader(page, sentences);
    const calls = () =>
      page.evaluate(
        () => (window as unknown as { wakeLockCalls: string[] }).wakeLockCalls,
      );
    expect(await calls()).toEqual([]);
    await page.getByRole("button", { name: "Play" }).click();
    await expect.poll(calls).toEqual(["request screen"]);
    await page.getByRole("button", { name: "Pause" }).click();
    await expect.poll(calls).toEqual(["request screen", "release"]);
  });

  test("the issue's run: keys, speed, hiding and resuming", async ({
    page,
  }) => {
    await openReader(page, sentences);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect(word(page)).toHaveText("Four");
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowUp");
    await expect(speed(page)).toHaveText("330 wpm");
    await page.keyboard.press("Space");
    await playing(page);
    // At 330 wpm, "Four" shows for about 273 ms, then "five".
    await page.clock.runFor(400);
    await expect(word(page)).toHaveText("five");
    await setVisibility(page, "hidden");
    await paused(page);
    await setVisibility(page, "visible");
    await page.clock.runFor(2000);
    await paused(page);
    await page.keyboard.press("Space");
    await playing(page);
    await expect(word(page)).toHaveText("Four");
  });
});
