# 4. Run Claude Code in Anthropic's reference dev container

Date: 2026-10-30
Status: Accepted

## Context

Claude Code builds this app with little supervision, so it must not run loose on the owner's PC. It needs an environment that limits what it can reach and rebuilds in minutes.

Anthropic publishes a reference dev container for this: a firewall that allows only listed hosts, a non-root user, and VS Code's Dev Containers extension. Its docs give copying the `.devcontainer` folder as the way to use it, and call it a working example rather than a maintained base image, so owning small fixes is expected. Anthropic's separate dev container feature was not used, because its bundled firewall script was reported as outdated.

## Decision

Claude Code runs only inside a copy of Anthropic's reference `.devcontainer`, on Docker Desktop with WSL 2. Changes from Anthropic's files:

- `node:24-bookworm` instead of `node:20`. Node 20 reached end of life in April 2026; naming bookworm keeps the Debian release the package list was written for.
- Time zone `Europe/London` instead of `America/Los_Angeles`, so commits carry the owner's time.
- `git.terminalAuthentication` and `github.gitAuthentication` off. Together with `dev.containers.gitCredentialHelperConfigLocation: "none"` and `dev.containers.copyGitConfig: false` in VS Code's user settings on Windows, this keeps the owner's Git login out. The only GitHub key inside is a fine-grained token for this repo: Contents, Issues and Pull requests read/write, Actions read, nothing else, 90 days. No SSH keys or agent.
- `ipset add -exist` for DNS results in `init-firewall.sh`. DNS can return the same IP twice; plain `ipset add` then fails, and `set -e` aborts the script before the firewall is on. Same fix as proposed in anthropics/claude-code#91327.

Claude Code's own setup:

- Project settings (`.claude/settings.json`): no attribution, since the README discloses AI use once, backed by `.githooks/commit-msg` (active after `git config core.hooksPath .githooks`); auto memory off, so corrections become proposed CLAUDE.md lines instead of unreviewed rules outside the repo; merging denied, because merging is the owner's review step; claude.ai connectors off (`ENABLE_CLAUDEAI_MCP_SERVERS=false`, from Claude Code's changelog, 2.1.63), because they reach the owner's accounts outside this repo.
- User settings, in the container's Claude volume, outside the repo: `permissions.defaultMode: "auto"`, so routine actions don't wait for prompts while a classifier still checks each one (Claude Code ignores auto mode in project settings, so a repo can't grant it to itself); `outputStyle: "caveman"`, from `~/.claude/output-styles/caveman.md`, which is `skills/caveman/SKILL.md` from JuliusBrussee/caveman at `9b68f7e` plus `keep-coding-instructions: true`, for terse chat replies. Its rules keep commits, PRs and docs in plain prose. The caveman plugin was rejected: it also adds hooks, about 20 skills, subagents and a command that writes rule files into the repo.

## Consequences

- Outbound traffic is limited to GitHub, npm, Anthropic's API, a few VS Code and telemetry hosts, DNS, SSH and the host network. Claude runs as a non-root user.
- The firewall fails open: if `init-firewall.sh` fails, the container runs without it. Don't run Claude unless the start log shows both `Firewall verification passed` lines.
- Allowed IPs are resolved once at start. A host whose IPs change during a long session can become unreachable until a restart.
- The GitHub CLI login isn't kept across rebuilds, so the token never sits on a volume. Log in again after each rebuild.
- Changes to `.devcontainer/` take effect only when the owner rebuilds.
- Playwright's Chromium and WebKit are baked into the image, pinned to the Playwright version (ADR 0005): the firewall blocks Playwright's download host and the browsers need root to install their libraries, but the image build runs outside the firewall.
- The user settings above live outside the repo; this record is where they're written down.
- Before adopting Anthropic's updates, compare them with these changes. Run this from Ubuntu, not the container, whose firewall blocks raw.githubusercontent.com:
  `for f in Dockerfile devcontainer.json init-firewall.sh; do curl -fsSL https://raw.githubusercontent.com/anthropics/claude-code/main/.devcontainer/$f | diff - .devcontainer/$f; done`
