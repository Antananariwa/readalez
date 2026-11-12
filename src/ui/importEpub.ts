// Reading an EPUB on the device (SPEC.md features 2 and 3): Import EPUB on
// the Add text screen and a built-in book's first open both go through here,
// so a built-in book is imported as any other (ADR 0013).

import { timeWords, type Timing } from "../core/durations.ts";
import { DrmError, parseEpub, type EpubBook } from "../core/epub.ts";
import {
  splitTextInSteps,
  type SplitProgress,
  type Word,
} from "../core/text.ts";

/** Why an EPUB couldn't be imported. */
export type ImportProblem = "unreadable" | "drm" | "empty";

export class ImportError extends Error {
  readonly problem: ImportProblem;

  constructor(problem: ImportProblem) {
    super(problem);
    this.problem = problem;
  }
}

/** An EPUB read and timed, ready for the library. */
export interface ImportedEpub extends EpubBook {
  /** `timeWords(splitText(sections))`, worked out once here. */
  timing: Timing;
}

/**
 * Reads and times an EPUB, calling `onProgress` between the steps of
 * splitting its text. It runs on the page's main thread and ends the current
 * task after each call, so the browser can draw the progress before the next
 * step (docs/known-issues.md); `onProgress` should draw at once (React's
 * `flushSync`). Rejects with an `ImportError`.
 */
export async function readEpub(
  bytes: Uint8Array<ArrayBuffer>,
  fileName: string,
  onProgress: (progress: SplitProgress) => void,
): Promise<ImportedEpub> {
  const show = async (progress: SplitProgress) => {
    onProgress(progress);
    await nextTask();
  };
  await show({ done: 0, total: 1 });
  let book;
  try {
    book = await parseEpub(bytes, fileName);
  } catch (error) {
    throw new ImportError(error instanceof DrmError ? "drm" : "unreadable");
  }
  let words: Word[];
  const steps = splitTextInSteps(book.sections);
  for (;;) {
    const step = steps.next();
    if (step.done) {
      words = step.value;
      break;
    }
    await show(step.value);
  }
  if (words.length === 0) throw new ImportError("empty");
  await show({ done: 1, total: 1 });
  return { ...book, timing: timeWords(words) };
}

/**
 * Resolves in a new task, posted through a `MessageChannel`, as React's
 * scheduler does when it yields to the browser between tasks. It prefers a
 * `MessageChannel` to `setTimeout` because of setTimeout's 4 ms clamping:
 * https://github.com/facebook/react/blob/e8738f0c628b4c321c5ce8077390ba48a8208341/packages/scheduler/src/forks/Scheduler.js#L452-L453
 * https://github.com/facebook/react/blob/e8738f0c628b4c321c5ce8077390ba48a8208341/packages/scheduler/src/forks/Scheduler.js#L546-L552
 * Waiting for `requestAnimationFrame` instead, imports never finished in
 * `e2e/readingFlow.spec.ts`, whose tests pause the page's clock first (#97).
 */
function nextTask(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}
