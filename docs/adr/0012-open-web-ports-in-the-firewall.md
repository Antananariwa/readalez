# 12. Open web ports in the dev container firewall

Date: 2026-11-10
Status: Accepted

## Context

- The reference firewall (ADR 0004) allows only these destinations ([its `init-firewall.sh`](https://github.com/anthropics/claude-code/blob/d945a61bc6346abce607252d5667df8a3bf0461a/.devcontainer/init-firewall.sh)):
  - GitHub, npm, Anthropic's API, and a few VS Code and telemetry hosts;
  - DNS and SSH, to any host;
  - Docker's own network.
- Claude's web search works, but reading a page fetches it from the container. So pages outside that list fail. Research fell back to search summaries, and allowing sites one by one was too much work (#71).
- Hosted coding agents start with limited internet access, and let the user allow more:
  - OpenAI Codex cloud "blocks internet access during the agent phase" by default. It can allow a list of domains, or all of them. Its listed risks include "Prompt injection from untrusted web content" and "Code or secret exfiltration" ([Codex, Internet access](https://learn.chatgpt.com/docs/cloud/internet-access)).
  - GitHub Copilot's coding agent starts behind a firewall with an allowlist. Turning it off "will allow Copilot to connect to any host", "increasing risks of exfiltration of code or other sensitive information" ([Copilot, Customizing the firewall](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall#enabling-or-disabling-the-firewall)).
  - Claude Code on the web starts at **Limited** network access, and offers **Full**, for any domain ([Claude Code, Cloud environments](https://code.claude.com/docs/en/cloud-environments#network-access)). The page names no risks.
- The limited list already left ways in and out:
  - Anyone can open issues or comment on this public repo, and the agent reads them.
  - GitHub's API accepts any account's token, so code in the container could post data to another account (not tried).

Options considered (#71):

- **Allow sites one by one:** too much work.
- **A separate research container** with no logins, passing checked text to this one: it needs a paid API key of its own, and a second container to run.
- **A hook that asks the owner before posting to GitHub once a session has read a web page:** the owner wouldn't spot a steered session at a prompt either.
- **Web ports open to any public host**, with light checks.

## Decision

- `init-firewall.sh` allows TCP ports 80 and 443 to any host outside private and local networks.
- It rejects `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` and `100.64.0.0/10`, so web ports don't reach devices on the home network. Two rules from the reference come first:
  - DNS (UDP port 53) to any address. The container's resolver, `192.168.65.7` (`/etc/resolv.conf`), is inside `192.168.0.0/16`, so a narrower rule would cut off name lookups.
  - Every port on Docker's own network, the default route's /24.
- The firewall allows no outbound SSH, since the git remote and `gh` use HTTPS.
- At start, the script runs four checks: example.com loads, GitHub's API loads, and its REJECT rules refuse example.com port 22 and 192.168.0.1 port 443. Each check that passes prints a `Firewall verification passed` line. The REJECT checks read the rules' packet counters, because a refusal from the far end looks the same to the connecting program.
- The project accepts the risk, with two light checks instead of more isolation:
  - the reviewer's list of changes to name (`.claude/agents/reviewer.md`);
  - CLAUDE.md's line on web research ([Limits](../../CLAUDE.md#limits)).
- The other options lose: one by one is too much work, a second container costs a key and its upkeep, and a prompt doesn't stop a steered session.

## Consequences

- A web page, or an issue or comment on the repo, can try to steer the agent ([known issue](../known-issues.md#a-web-page-or-an-issue-can-carry-instructions-for-the-agent)). A steered session can reach:
  - the GitHub token (this repo only, and expiring);
  - the Claude login;
  - the container's Claude Code history;
  - the repo folder.

  It could send these to any web server without a trace on GitHub, or put a harmful change in a PR. It can't become root, or read the PC's files outside the repo folder. Beyond web ports, it reaches only what the reference allows: DNS to any address, and every port on the listed hosts and on Docker's network.

- Merging is probably not blocked for the token (#96).
- The container can change files that the PC runs later. One is `devcontainer.json`, whose `initializeCommand` runs "on the host machine" ([Dev Container spec, Lifecycle scripts](https://containers.dev/implementors/json_reference/#lifecycle-scripts)).
- The reviewer runs in the same session as the work, so its list helps against mistakes more than against a steered session.
- Revisit if the app starts keeping readers' data on a server, the container gets more secrets, or a session does something nobody can explain.
