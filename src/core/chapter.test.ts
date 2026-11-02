// End-to-end check of the reading core for issue #7: a public-domain chapter
// goes from sections and paragraphs through the words (#6) and the timing
// rules into a schedule played on a fake clock.

import { describe, expect, it } from "vitest";
import { timeWords } from "./durations.ts";
import { storyOfTheDoor } from "./fixtures/storyOfTheDoor.ts";
import { isFinished, play, tick } from "./schedule.ts";
import { sentenceStarts } from "./sentences.ts";
import { splitText, wordText } from "./text.ts";
import { timeLeft } from "./timeLeft.ts";

describe("a chapter of Jekyll and Hyde at 300 wpm", () => {
  const words = splitText([storyOfTheDoor]);
  const timing = timeWords(words);

  it("shows every word once, in order, in the time left computed at the start", () => {
    const { chapter, book } = timeLeft(timing, 0, 300);
    expect(chapter).toBe(book);

    const order: number[] = [];
    let playback = play(timing, 0, 300, 0);
    order.push(playback.index);
    let now = 0;
    while (!isFinished(timing, playback)) {
      now += 1000 / 60;
      const next = tick(timing, playback, now);
      if (!isFinished(timing, next) && next.index !== playback.index) {
        order.push(next.index);
      }
      playback = next;
    }

    expect(order).toEqual(words.map((_, i) => i));
    expect(Math.abs(now - chapter) / chapter).toBeLessThan(0.01);
  });

  it("starts no sentence after Mr.", () => {
    const starts = sentenceStarts(words);
    const afterMr = starts.filter(
      (i) => i > 0 && wordText(words[i - 1]!) === "Mr.",
    );
    expect(afterMr).toEqual([]);
    expect(starts.length).toBeGreaterThan(80);
  });
});
