#!/usr/bin/env bash
# Stop hook: Claude can't end a turn while `npm run check` fails.
# Exit 2 blocks the stop and sends the error back to Claude.
# If Claude is already retrying because of this hook, let it stop (no loops).
input="$(cat)"
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -f package.json ] || exit 0   # nothing to check before the scaffold exists

# Skip when nothing changed (planning, answering questions).
if [ -z "$(git status --porcelain)" ] && \
   [ "$(git rev-parse HEAD 2>/dev/null)" = "$(git rev-parse origin/main 2>/dev/null)" ]; then
  exit 0
fi

if ! out="$(npm run -s check 2>&1)"; then
  {
    echo "npm run check failed. Fix the cause; don't weaken tests or config."
    printf '%s\n' "$out" | tail -n 60
  } >&2
  exit 2
fi
exit 0