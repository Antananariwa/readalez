// The reading flow (SPEC.md features 2, 4 and 7, issue #15): which parts of
// a text reading goes through, which it skips, and where its chapters start.
// A text is a list of parts in reading order, each in the flow or skipped
// (ADR 0011). Reading starts at the flow's first word, jumps over skipped
// parts between, and finishes after its last word. Playing a skipped part
// reads it to its end and stops there.

import type { Position } from "./position.ts";

/** A paragraph's place in a text: where a part or a chapter starts. */
export interface Place {
  section: number;
  paragraph: number;
}

/**
 * A part of a text, from its place to the next part's. Stored with the text
 * (ADR 0011), so positions keep their meaning when the splitting rules
 * change.
 */
export interface Part extends Place {
  skipped: boolean;
}

/** A text's parts as word indices, worked out once per open. */
export interface Flow {
  /** The word each part starts at, ascending; the first is 0. */
  readonly starts: readonly number[];
  readonly skipped: readonly boolean[];
  /** How many of the flow's words come before each part. */
  readonly before: readonly number[];
  /** How many words the flow has. */
  readonly count: number;
  /** How many words the text has. */
  readonly words: number;
}

/** -1, 0 or 1 as the word comes before, in or after the place's paragraph. */
function comparePlace(word: Position, place: Place): number {
  return (
    Math.sign(word.section - place.section) ||
    Math.sign(word.paragraph - place.paragraph)
  );
}

/**
 * The index of the first word at or after `place`; `words.length` when
 * there is none.
 */
export function firstWordAt(words: readonly Position[], place: Place): number {
  let low = 0;
  let high = words.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (comparePlace(words[mid]!, place) < 0) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * The flow of a text split into `words`. Parts that show no words are
 * dropped, and neighbours that are both in or both out of the flow merge.
 * With no parts, or none in the flow, the whole text is the flow, as for
 * pasted text and books stored before #15.
 */
export function readingFlow(
  words: readonly Position[],
  parts: readonly Part[] = [],
): Flow {
  const starts: number[] = [];
  const skipped: boolean[] = [];
  for (const part of parts) {
    const start = starts.length === 0 ? 0 : firstWordAt(words, part);
    if (start >= words.length && starts.length > 0) break;
    // A part with no words gives way to the one after it.
    if (starts.at(-1) === start) {
      starts.pop();
      skipped.pop();
    }
    if (skipped.at(-1) === part.skipped) continue;
    starts.push(start);
    skipped.push(part.skipped);
  }
  if (!skipped.includes(false)) {
    return {
      starts: [0],
      skipped: [false],
      before: [0],
      count: words.length,
      words: words.length,
    };
  }
  const before: number[] = [];
  let count = 0;
  starts.forEach((start, k) => {
    before.push(count);
    if (!skipped[k]) count += (starts[k + 1] ?? words.length) - start;
  });
  return { starts, skipped, before, count, words: words.length };
}

/** The index of the part holding word `index`. */
export function partAt(flow: Flow, index: number): number {
  let low = 0;
  let high = flow.starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (flow.starts[mid]! <= index) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** The index just past part `k`'s last word. */
function partEnd(flow: Flow, k: number): number {
  return flow.starts[k + 1] ?? flow.words;
}

export function inFlow(flow: Flow, index: number): boolean {
  return !flow.skipped[partAt(flow, index)];
}

/** The flow's first word, where a book first opens and Start over goes. */
export function flowStart(flow: Flow): number {
  return flow.starts[flow.skipped.indexOf(false)] ?? 0;
}

/**
 * How many of the flow's words come before word `index`: inside a skipped
 * part, as many as before the flow's next word, so 0 before the flow and
 * all of them after it.
 */
export function flowOrdinal(flow: Flow, index: number): number {
  if (index >= flow.words) return flow.count;
  const k = partAt(flow, index);
  return flow.before[k]! + (flow.skipped[k] ? 0 : index - flow.starts[k]!);
}

/** The word index of the flow's word `ordinal`, clamped to the flow. */
export function flowIndex(flow: Flow, ordinal: number): number {
  const target = Math.min(Math.max(ordinal, 0), Math.max(flow.count - 1, 0));
  let found = flowStart(flow);
  flow.starts.forEach((start, k) => {
    if (!flow.skipped[k] && flow.before[k]! <= target) {
      found = start + target - flow.before[k]!;
    }
  });
  return found;
}

/**
 * Progress at word `index` (SPEC.md feature 4): 0 at the flow's first word
 * and anywhere before it, 1 after its last word.
 */
export function flowProgress(flow: Flow, index: number): number {
  return flow.count === 0 ? 0 : flowOrdinal(flow, index) / flow.count;
}

/**
 * What follows word `index` while playing: the next word, which skips over
 * skipped parts inside the flow; "stop" at the end of a skipped part, which
 * is read to its end and no further; or "end" after the flow's last word,
 * where the book is finished.
 */
export function nextWord(flow: Flow, index: number): number | "stop" | "end" {
  const k = partAt(flow, index);
  if (index + 1 < partEnd(flow, k)) return index + 1;
  if (flow.skipped[k]) return index + 1 < flow.words ? "stop" : "end";
  for (let j = k + 1; j < flow.starts.length; j++) {
    if (!flow.skipped[j]) return flow.starts[j]!;
  }
  return "end";
}

/**
 * The sentence starts that moving by a sentence from word `index` can reach
 * (SPEC.md feature 7): in the flow, the flow's own, and in a skipped part,
 * that part's. Each part's first word counts as a sentence start.
 */
export function sentenceStartsAround(
  flow: Flow,
  starts: readonly number[],
  index: number,
): number[] {
  const here = partAt(flow, index);
  const reachable = (k: number) =>
    flow.skipped[here] ? k === here : !flow.skipped[k];
  const found = new Set<number>();
  flow.starts.forEach((start, k) => {
    if (reachable(k) && start < flow.words) found.add(start);
  });
  for (const start of starts) {
    if (reachable(partAt(flow, start))) found.add(start);
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Where a text's chapters start (SPEC.md feature 7): at each chapter-list
 * entry and each part, so a chapter runs to the next entry at any depth and
 * is wholly in or out of the flow. The first starts at the text's start.
 */
export interface ChapterBounds {
  /** Each chapter's first paragraph, in reading order. */
  readonly places: readonly Place[];
  /** Each chapter's first word: the first at or after its place. */
  readonly firstWords: readonly number[];
}

export function chapterBounds(
  words: readonly Position[],
  entries: readonly Place[],
  parts: readonly Part[] = [],
): ChapterBounds {
  const unique = new Map<string, Place>();
  for (const place of [{ section: 0, paragraph: 0 }, ...entries, ...parts]) {
    unique.set(`${place.section}:${place.paragraph}`, {
      section: place.section,
      paragraph: place.paragraph,
    });
  }
  const places = [...unique.values()].sort(
    (a, b) => a.section - b.section || a.paragraph - b.paragraph,
  );
  return {
    places,
    firstWords: places.map((place) => firstWordAt(words, place)),
  };
}

/**
 * The chapter holding word `index`: the last one starting at or before it,
 * so of entries at the same word, the deepest (listed last) wins.
 */
export function chapterAt(bounds: ChapterBounds, index: number): number {
  let low = 0;
  let high = bounds.firstWords.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (bounds.firstWords[mid]! <= index) low = mid;
    else high = mid - 1;
  }
  return low;
}

/**
 * The chapter-list entry that holds word `index`, from each entry's first
 * word (`firstWordAt`): the one starting last at or before it, and of
 * entries starting at the same word, the one listed last, so the deepest
 * wins. -1 before the first entry.
 */
export function entryAt(firstWords: readonly number[], index: number): number {
  let found = -1;
  firstWords.forEach((first, i) => {
    if (first <= index && (found === -1 || first >= firstWords[found]!)) {
      found = i;
    }
  });
  return found;
}
