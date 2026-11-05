// The paused view (SPEC.md feature 7): the chapter's text below the frame,
// with the current word marked. Tapping a word moves the frame to it.
//
// A pasted novel is one chapter of up to about 200,000 words (#11), so each
// paragraph is one plain text node, and only the current word's paragraph is
// split around a <mark>. A tap is turned into a place in the text with the
// browser's caret-from-point API (see `caretAt`), and src/core/chapterText.ts
// turns that place into a word.

import { memo, useLayoutEffect, useRef, type MouseEvent } from "react";
import { wordAtOffset, type ParagraphText } from "../core/chapterText.ts";

interface Props {
  /** The paragraphs of the current word's chapter. */
  paragraphs: readonly ParagraphText[];
  /** The word on screen, as an index into the whole text. */
  index: number;
  /** The index of the word's paragraph within its chapter. */
  paragraph: number;
  onTap: (index: number) => void;
}

export default function PausedText({
  paragraphs,
  index,
  paragraph,
  onTap,
}: Props) {
  const pane = useRef<HTMLElement>(null);

  // Brings the marked word into view when it's outside the pane: on opening,
  // and after a move. The pane scrolls itself, not the page.
  useLayoutEffect(() => {
    const paneEl = pane.current;
    const mark = paneEl?.querySelector("mark");
    if (!paneEl || !mark) return;
    const box = paneEl.getBoundingClientRect();
    const word = mark.getBoundingClientRect();
    if (word.top >= box.top && word.bottom <= box.bottom) return;
    paneEl.scrollTop +=
      word.top - box.top - paneEl.clientHeight / 2 + word.height / 2;
  }, [index]);

  const tap = (event: MouseEvent) => {
    const caret = caretAt(event.clientX, event.clientY);
    if (!caret) return;
    const start =
      caret.node instanceof Element ? caret.node : caret.node.parentElement;
    const p = start?.closest<HTMLElement>("p[data-paragraph]");
    if (!p || !pane.current?.contains(p)) return;
    const text = paragraphs[Number(p.dataset.paragraph)];
    if (!text) return;
    const range = document.createRange();
    range.setStart(p, 0);
    range.setEnd(caret.node, caret.offset);
    const word = wordAtOffset(text, range.toString().length);
    if (word !== null) onTap(word);
  };

  const current = paragraphs[paragraph];
  const k = current ? index - current.first : -1;
  return (
    <section
      className="paused-text"
      aria-label="Text"
      data-testid="paused-text"
      ref={pane}
      onClick={tap}
    >
      {paragraphs.map((text, i) => (
        <Paragraph
          key={i}
          number={i}
          text={text}
          mark={
            i === paragraph && k >= 0
              ? { start: text.starts[k] ?? 0, end: text.ends[k] ?? 0 }
              : null
          }
        />
      ))}
    </section>
  );
}

interface ParagraphProps {
  number: number;
  text: ParagraphText;
  mark: { start: number; end: number } | null;
}

/** One paragraph; only the ones whose mark changes render again. */
const Paragraph = memo(
  function Paragraph({ number, text, mark }: ParagraphProps) {
    const content = mark ? (
      <>
        {text.text.slice(0, mark.start)}
        <mark data-testid="current-word">
          {text.text.slice(mark.start, mark.end)}
        </mark>
        {text.text.slice(mark.end)}
      </>
    ) : (
      text.text
    );
    return (
      <p className={text.kind} data-paragraph={number}>
        {content}
      </p>
    );
  },
  (a, b) =>
    a.number === b.number &&
    a.text === b.text &&
    a.mark?.start === b.mark?.start &&
    a.mark?.end === b.mark?.end,
);

/**
 * The text node and offset under a point. MDN's compatibility data lists
 * `caretPositionFromPoint` in Chrome from 128, Firefox from 20 and Safari
 * from 26.2, and `caretRangeFromPoint` in Safari on iOS from 4, so iOS 18.4
 * uses the second
 * (https://github.com/mdn/browser-compat-data/blob/188707c73f5a93701429eadcdaf35d6e31715c67/api/Document.json#L1090-L1200).
 */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  if ("caretPositionFromPoint" in document) {
    const position = document.caretPositionFromPoint(x, y);
    return position && { node: position.offsetNode, offset: position.offset };
  }
  if ("caretRangeFromPoint" in document) {
    const range = (document as Document).caretRangeFromPoint(x, y);
    return range && { node: range.startContainer, offset: range.startOffset };
  }
  return null;
}
