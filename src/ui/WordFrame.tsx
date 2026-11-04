// The word frame (SPEC.md feature 5): the focus letter's centre sits on a
// fixed point, 40% of the way across, with lines above and below and a
// tick on each at that point. Placement is pure CSS (styles.css): the focus
// letter is centred on the point, and the text before and after it hangs off
// its sides. A word too wide for the frame shrinks while it shows.

import { useLayoutEffect, useRef } from "react";
import type { Word } from "../core/text.ts";

interface Props {
  word: Word;
  playing: boolean;
  onToggle: () => void;
}

export default function WordFrame({ word, playing, onToggle }: Props) {
  const area = useRef<HTMLSpanElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const before = useRef<HTMLSpanElement>(null);
  const focus = useRef<HTMLSpanElement>(null);
  const after = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const fit = () => {
      const parts = [area, anchor, before, focus, after].map((r) => r.current);
      const [areaEl, anchorEl, beforeEl, focusEl, afterEl] = parts;
      if (!areaEl || !anchorEl || !beforeEl || !focusEl || !afterEl) return;
      anchorEl.style.fontSize = "";
      const width = areaEl.clientWidth;
      // The anchor sits on the focus point (--focus-point in styles.css).
      const point = anchorEl.offsetLeft;
      const half = focusEl.getBoundingClientRect().width / 2;
      const left = beforeEl.getBoundingClientRect().width + half;
      const right = afterEl.getBoundingClientRect().width + half;
      const scale = Math.min(point / left, (width - point) / right);
      // A little room, since text widths don't scale exactly with font size (not checked).
      if (scale < 1) anchorEl.style.fontSize = `${scale * 0.97}em`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (area.current) observer.observe(area.current);
    return () => observer.disconnect();
  }, [word]);

  return (
    <button
      type="button"
      className="frame"
      aria-label={playing ? "Pause" : "Play"}
      onClick={onToggle}
    >
      <span className="frame-line" aria-hidden="true">
        <span className="tick" data-testid="tick" />
      </span>
      <span className="word-area" ref={area}>
        <span className="anchor" ref={anchor} data-testid="word">
          <span className="focus" ref={focus} data-testid="focus">
            <span className="before" ref={before}>
              {word.before}
            </span>
            {word.focus}
            <span className="after" ref={after}>
              {word.after}
            </span>
          </span>
        </span>
      </span>
      <span className="frame-line" aria-hidden="true">
        <span className="tick" data-testid="tick" />
      </span>
    </button>
  );
}
