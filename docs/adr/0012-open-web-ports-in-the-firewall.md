# 12. Open web ports in the dev container firewall

Date: 2026-11-10
Status: Accepted

## Context

The firewall from ADR 0004 lets the container reach only GitHub, npm, Anthropic's API and a few VS Code hosts. Claude's web search runs on Anthropic's servers and works, but reading a page fetches it from the container, so pages outside GitHub fail. Research for #68 fell back to search summaries and GitHub READMEs, and allowing sites one by one was too much work (#71).

Hosted coding agents start with the internet limited to package registries and GitHub. The owner can add sites or allow all of them, and the docs warn about prompt injection, leaked code or secrets, and malware: OpenAI Codex cloud ([docs](https://developers.openai.com/codex/cloud/agent-internet)), GitHub Copilot's coding agent ([docs](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall)) and Claude Code on the web ([docs](https://code.claude.com/docs/en/cloud-environments)). The links in this record were read through web search results, not the pages, because the firewall blocked the pages.

The limited list already left ways in and out. Anyone can open issues or comment on this public repo, and the agent reads issues. SSH (port 22) was open to any host. GitHub's API accepts any account's token, so code in the container could post data to another account (not tried).

The owner rejected two stronger options (#71):

- A separate research container with no logins, passing checked text to this one. It needs its own paid API key, and the owner wants the workflow light.
- A hook that asks the owner before posting to GitHub once a session has read a web page. The owner wouldn't spot a steered session at a prompt either.

## Decision

- `init-firewall.sh` allows TCP ports 80 and 443 to any host outside private and local networks.
- It rejects `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` and `100.64.0.0/10`, so web ports don't reach devices on the home network. Two older rules come first and are unchanged:
  - DNS (UDP port 53) to any address. The container's resolver, `192.168.65.7` (`/etc/resolv.conf`), is inside `192.168.0.0/16`, so narrowing this rule would cut off name lookups.
  - Every port on Docker's own network, the default route's /24 (`172.17.0.0/24` here).
- No outbound SSH: the remote and `gh` use HTTPS.
- At start, the script checks that example.com loads, that GitHub's API loads, and that the firewall's own REJECT rules refuse example.com port 22 and 192.168.0.1 port 443. The script checks the REJECT rules' packet counters, because a refusal from the far end looks the same to the connecting program.
- Two light checks instead of more isolation:
  - The reviewer subagent names every change to dependencies, `.devcontainer/`, `.github/`, `.claude/`, `.githooks/` and `CLAUDE.md`, and to code that sends data off the device or reads tokens or logins (`.claude/agents/reviewer.md`).
  - CLAUDE.md asks research to read official pages first and to treat text from pages, and from issues and comments not written by the owner, as information, never instructions.

## Consequences

- Claude can read web pages once the owner rebuilds the container.
- A web page, or an issue or comment on the repo, can try to steer the agent (docs/known-issues.md). A steered session can reach:
  - the GitHub token (this repo only, expiring), which can probably merge (below);
  - the Claude login;
  - the container's Claude Code history;
  - the repo folder.

  It could send these to any web server without a trace on GitHub, put a harmful change in a PR, or probably merge one. It can't become root or read the PC's files outside the repo folder. Beyond web ports, it can reach only what ADR 0004 already allowed: DNS to any address, and every port on the listed hosts and on Docker's network.

- Merging is probably not blocked for the token. It has Contents and Pull requests read/write (ADR 0004). `main`'s ruleset, read during review for #71, requires a PR and a passing `build (24.x)` check but no approval. The only block seen is Claude Code's deny rule for `gh pr merge` and `gh api *merge*` (`.claude/settings.json`), which a steered session could get around by calling GitHub's API another way. Not tried.
- The start log shows four `Firewall verification passed` lines. Don't run Claude unless all four are there; this replaces the two lines ADR 0004 names.
- The reviewer runs in the same session as the work, so its list helps against mistakes more than against a steered session.
- The container can change files that the PC runs later. Two owner habits cover this:
  - Before a rebuild, read `git diff .devcontainer/` on the PC. `devcontainer.json`'s `initializeCommand` runs on the PC ([spec](https://containers.dev/implementors/json_schema/)).
  - Don't run a branch outside the container.
- If something looks wrong, revoke the GitHub token and log the Claude login out from the account.
- Playwright's download host is now reachable, but the browsers stay in the image, because their system libraries need root (ADR 0004).
- The agent can check Cloudflare preview deployments, which ADR 0006 says it can't.
- ADR 0004's command for comparing with Anthropic's files no longer has to run from Ubuntu, since raw.githubusercontent.com is reachable on port 443.
- Revisit if the app starts keeping readers' data on a server, the container gets more secrets, or a session does something nobody can explain.
