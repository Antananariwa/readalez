import { describe, expect, it } from "vitest";
import { timeWords, wordDuration, type Timing } from "./durations.ts";
import { isFinished, play, setSpeed, tick, type Playback } from "./schedule.ts";
import { splitText } from "./text.ts";

/** `count` words with a comma, a sentence end and a long word now and then. */
function sampleTiming(count: number): Timing {
  const pattern = ["The", "lawyer", "walked,", "thoughtfully", "home."];
  const text = Array.from(
    { length: count },
    (_, i) => pattern[i % pattern.length],
  ).join(" ");
  const words = splitText([{ paragraphs: [{ kind: "prose", text }] }]);
  expect(words).toHaveLength(count);
  return timeWords(words);
}

/** The schedule's total: the first word as after play, the rest as usual. */
function total(timing: Timing, wpm: number): number {
  return timing.words.reduce(
    (sum, _, i) => sum + wordDuration(timing, i, wpm, i === 0),
    0,
  );
}

/** Frames every `interval` ms, with one `stall` ms gap after `stallAt` ms. */
function* frames(interval: number, stallAt = Infinity, stall = 0) {
  let t = 0;
  let stalled = false;
  for (;;) {
    t += interval;
    if (!stalled && t >= stallAt) {
      t += stall;
      stalled = true;
    }
    yield t;
  }
}

interface Run {
  /** The word index on screen at each frame. */
  shown: number[];
  /** The frame at which the last word had ended. */
  finishedAt: number;
}

/** Plays from the first word at time 0 until the last word ends. */
function run(timing: Timing, wpm: number, clock: Iterable<number>): Run {
  let playback: Playback = play(timing, 0, wpm, 0);
  const shown = [playback.index];
  for (const now of clock) {
    playback = tick(timing, playback, now);
    if (isFinished(timing, playback)) return { shown, finishedAt: now };
    shown.push(playback.index);
  }
  throw new Error("the clock stopped");
}

/** The word indexes in the order they appeared, each run of frames once. */
function order(shown: number[]): number[] {
  return shown.filter((index, i) => i === 0 || index !== shown[i - 1]);
}

describe("schedule", () => {
  it("plays 1,000 words at 1,000 wpm within 1% of their computed total", () => {
    const timing = sampleTiming(1000);
    const expected = total(timing, 1000);
    const { finishedAt } = run(timing, 1000, frames(1000 / 60));
    expect(Math.abs(finishedAt - expected) / expected).toBeLessThan(0.01);
  });

  it("doesn't drift: late frames don't move later words' scheduled ends", () => {
    const timing = sampleTiming(200);
    let playback = play(timing, 0, 1000, 0);
    let due = playback.endsAt;
    for (const now of frames(1000 / 60)) {
      const next = tick(timing, playback, now);
      if (isFinished(timing, next)) break;
      if (next.index !== playback.index) {
        due += wordDuration(timing, next.index, 1000);
        expect(next.endsAt).toBe(due);
      }
      playback = next;
    }
    expect(due).toBe(total(timing, 1000));
  });

  it("shows every word, in order, with 30 Hz frames and a 250 ms stall", () => {
    const timing = sampleTiming(1000);
    const { shown, finishedAt } = run(timing, 1000, frames(33, 5000, 250));
    expect(order(shown)).toEqual(timing.words.map((_, i) => i));
    // The stall slows reading down instead of being made up by skipping
    // words: only the word due during the stall can come back shortened.
    expect(finishedAt).toBeGreaterThan(total(timing, 1000));
  });

  it("shows every word at the fastest speed with frames slower than words", () => {
    const timing = sampleTiming(100);
    const { shown } = run(timing, 1000, frames(100));
    expect(order(shown)).toEqual(timing.words.map((_, i) => i));
  });

  it("applies a speed change from the next word", () => {
    const timing = sampleTiming(5);
    const started = play(timing, 0, 300, 0);
    expect(started.endsAt).toBe(300); // "The" as the first word: 1.5×
    const faster = setSpeed(started, 600);
    expect(faster.endsAt).toBe(300); // the word on screen keeps its time
    const next = tick(timing, faster, 300);
    expect(next.index).toBe(1);
    expect(next.endsAt).toBe(400); // "lawyer" at 600 wpm: 100 ms
  });

  it("starts at any word, and finishes after the last", () => {
    const timing = sampleTiming(5);
    const started = play(timing, 4, 300, 1000);
    // "home." ends the paragraph: 5×, more than the first word's 1.5×.
    expect(started).toEqual({ index: 4, endsAt: 1000 + 1000, wpm: 300 });
    expect(tick(timing, started, 1999)).toBe(started);
    const done = tick(timing, started, 2000);
    expect(isFinished(timing, done)).toBe(true);
    expect(tick(timing, done, 5000)).toBe(done);
    expect(isFinished(timing, play(timing, 5, 300, 0))).toBe(true);
  });

  it("keeps the speed within 100–1,000 wpm in steps of 10", () => {
    const timing = sampleTiming(5);
    expect(play(timing, 0, 2000, 0).wpm).toBe(1000);
    expect(setSpeed(play(timing, 0, 300, 0), 42).wpm).toBe(100);
  });
});
