# 4. Run Claude Code in Anthropic's reference dev container

Date: 2026-10-30
Status: Accepted

## Context

Claude Code builds this app with little supervision, so it must not run loose on the owner's PC. It needs an environment that limits what it can reach and rebuilds in minutes. Anthropic's docs warn that, with all permissions granted, a dev container doesn't "prevent a malicious project from exfiltrating anything accessible inside the container, including the Claude Code credentials" ([Claude Code, Development containers](https://code.claude.com/docs/en/devcontainer)). So what goes inside matters as much as the walls.

Options considered:

- **Claude Code directly on the PC:** it would reach the owner's files, logins and home network.
- **Anthropic's Claude Code Dev Container Feature:** it installs the CLI into any dev container ([Claude Code, Development containers](https://code.claude.com/docs/en/devcontainer#add-claude-code-to-your-dev-container)), and brings no firewall ([its `install.sh`](https://github.com/anthropics/devcontainer-features/blob/5f27209dc5d554f05d20af15bf86ae2b674a3154/src/claude-code/install.sh)).
- **Anthropic's reference dev container:**
  - Its `init-firewall.sh` "limits outbound traffic to the destinations the script allows" ([Claude Code, Development containers](https://code.claude.com/docs/en/devcontainer#restrict-network-egress)).
  - It runs Claude Code "as a non-root user" ([Claude Code, Development containers](https://code.claude.com/docs/en/devcontainer#run-without-permission-prompts)).
  - It is "a working example rather than a maintained base image", and the docs say to "copy the `.devcontainer/` directory into your repository" ([Claude Code, Development containers](https://code.claude.com/docs/en/devcontainer#try-the-reference-container)).

## Decision

- **Claude Code runs only inside a copy of Anthropic's reference `.devcontainer`**, on Docker Desktop with WSL 2. Fixes to the copy are this project's to own.
  - Its firewall also opens web ports (ADR 0010).
  - Its image also holds Playwright's browsers (ADR 0005).
- **The owner's logins stay out.**
  - `devcontainer.json` turns off `git.terminalAuthentication` and `github.gitAuthentication`. VS Code's user settings on Windows set `dev.containers.gitCredentialHelperConfigLocation: "none"` and `dev.containers.copyGitConfig: false`. So the owner's Git login doesn't reach the container.
  - No SSH keys or agent go in.
- **The only GitHub credential inside is a fine-grained token for this repo:** Contents, Issues and Pull requests read/write, Actions read, nothing else, for 90 days.
- **Claude Code's project settings** (`.claude/settings.json`):
  - They deny `gh pr merge` and `gh api *merge*`, because merging is the owner's review step.
  - They turn claude.ai connectors off with `ENABLE_CLAUDEAI_MCP_SERVERS=false` ([Claude Code, Changelog, 2.1.63](https://github.com/anthropics/claude-code/blob/eb8e6d253d0dbee6e52fb0d5fdcb72c9396fe3e8/CHANGELOG.md#L10007)), because connectors reach the owner's accounts outside this repo.
- **Claude Code's user settings,** in the container's Claude volume, set `permissions.defaultMode: "auto"`.
  - In auto mode, a classifier "reviews actions before they run and blocks the ones it judges risky" ([Claude Code, Permission modes](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode)). So routine actions don't wait for a prompt.
  - Project settings can't set it ([Claude Code, Settings](https://code.claude.com/docs/en/settings#a-value-you-set-is-ignored)), so the repo can't grant it to itself.
- The other options lose:
  - Claude Code on the PC would have no limit.
  - The Feature would bring no firewall.

## Consequences

- Claude Code runs as a non-root user and reaches only what the firewall allows (ADR 0010).
- The firewall fails open: if `init-firewall.sh` fails, the container runs without it ([known issue](../known-issues.md#the-firewall-fails-open)).
- No volume holds `gh`'s login, so the token never sits on a volume, and each rebuild needs a new login.
- A change to `.devcontainer/` takes effect only when the owner rebuilds.
- Anthropic's later changes to its files don't reach this copy by themselves.
