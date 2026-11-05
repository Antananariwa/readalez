// A button that acts once when pressed and keeps acting while held, like a
// stepper: after HOLD_DELAY ms, every REPEAT_EVERY ms until it's let go.

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

const HOLD_DELAY = 400;
const REPEAT_EVERY = 100;

interface Props {
  label: string;
  onStep: () => void;
  children: ReactNode;
}

export default function RepeatButton({ label, onStep, children }: Props) {
  // The latest onStep, so a long hold steps from the current value.
  const step = useRef(onStep);
  useLayoutEffect(() => {
    step.current = onStep;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const repeat = (delay: number) => {
    timer.current = setTimeout(() => {
      step.current();
      repeat(REPEAT_EVERY);
    }, delay);
  };

  return (
    <button
      type="button"
      className="repeat"
      aria-label={label}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        stop();
        step.current();
        repeat(HOLD_DELAY);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // A long press on a phone would otherwise open a menu.
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        // A pointer press has already stepped; Enter on a focused button
        // reaches here only as a click, with no pointer (detail 0).
        if (event.detail === 0) step.current();
      }}
    >
      {children}
    </button>
  );
}
