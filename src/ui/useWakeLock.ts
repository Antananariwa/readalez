// Screen awake (SPEC.md feature 7): holds a screen wake lock while `active`,
// and releases it otherwise, so the screen can lock as usual.

import { useEffect } from "react";

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let done = false;
    navigator.wakeLock.request("screen").then(
      (lock) => {
        if (done) void lock.release();
        else sentinel = lock;
      },
      // A refused request (when and why is not checked) leaves reading
      // working; the screen may dim and lock as usual.
      () => {},
    );
    return () => {
      done = true;
      void sentinel?.release();
    };
  }, [active]);
}
