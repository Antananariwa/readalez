#!/usr/bin/env bash
# PreToolUse hook on Bash: `gh pr create` is blocked unless its --body-file
# (or -F) has a filled-in "## Review" section (CLAUDE.md, Workflow). Exit 2
# blocks the command and sends the message back to Claude. It checks that the
# section has text, not what the text says. An inline body can't be checked
# exactly, so it's blocked too.
input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"

# Only a command that starts with `gh pr create` (or its alias `gh pr new`),
# at the start or after ; & | ( — not the phrase inside a quoted message.
start='(^|[;&|(][[:space:]]*)gh[[:space:]]+pr[[:space:]]+(create|new)([[:space:]]|$)'
printf '%s\n' "$cmd" | grep -qE "$start" || exit 0

# True when the file has "## Review" followed by a line that isn't blank or
# an HTML comment, before the next "## " heading.
has_review() {
  awk '/^## Review[[:space:]]*$/ { on = 1; next }
       on && /^## / { on = 0 }
       on && !/^[[:space:]]*$/ && !/^[[:space:]]*<!--.*-->[[:space:]]*$/ { found = 1 }
       END { exit !found }' "$1"
}

cd "$(printf '%s' "$input" | jq -r '.cwd // "."')" 2>/dev/null || true
# Every word after --body-file / -F is a candidate; one file must pass.
while IFS= read -r file; do
  [ -f "$file" ] && has_review "$file" && exit 0
done < <(printf '%s\n' "$cmd" | tr '\n' ' ' \
  | grep -oE "(--body-file|-F)[= ]*(\"[^\"]+\"|'[^']+'|[^ ;&|]+)" \
  | sed -E "s/^(--body-file|-F)[= ]*//; s/^[\"']//; s/[\"']\$//")

echo "Blocked: pass the PR body with --body-file, and give it a filled-in '## Review' section with the reviewer subagent's findings (CLAUDE.md, Workflow)." >&2
exit 2
