import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMING,
  DEFAULT_WPM,
  MAX_WPM,
  MIN_WPM,
  WPM_STEP,
  clampSpeed,
  stepSpeed,
} from "./timingValues.ts";

describe("DEFAULT_TIMING", () => {
  // Pinned to SPEC.md feature 6's table. A PR that changes a value here
  // updates that table in the same PR (SPEC.md feature 11).
  it("matches SPEC.md feature 6's table", () => {
    expect(DEFAULT_TIMING).toEqual({
      longWordLetters: 8, // has 8 or more letters…
      longWord: 1.3, // …shows for 1.3×
      clause: 2, // ends with , ; : a dash or a closing bracket
      verseLine: 2, // ends a line of verse
      sentence: 3, // ends a sentence
      paragraph: 4, // ends a paragraph or a heading, or comes before a heading
      start: 3, // the first after play or a jump: at least 3×
    });
  });
});

describe("speed", () => {
  it("runs from 100 to 1,000 wpm in steps of 10, starting at 300", () => {
    expect([MIN_WPM, MAX_WPM, WPM_STEP, DEFAULT_WPM]).toEqual([
      100, 1000, 10, 300,
    ]);
  });

  it("keeps a speed in range and on a step", () => {
    expect(clampSpeed(50)).toBe(100);
    expect(clampSpeed(1200)).toBe(1000);
    expect(clampSpeed(304)).toBe(300);
    expect(clampSpeed(305)).toBe(310);
    expect(clampSpeed(Number.NaN)).toBe(300);
  });

  it("steps by 10 and stops at the ends", () => {
    expect(stepSpeed(300, 1)).toBe(310);
    expect(stepSpeed(300, -1)).toBe(290);
    expect(stepSpeed(300, 3)).toBe(330);
    expect(stepSpeed(100, -1)).toBe(100);
    expect(stepSpeed(1000, 1)).toBe(1000);
  });
});
