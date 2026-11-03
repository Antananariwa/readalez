# Readalez

A speed-reading web app for practicing on real, meaningful texts: one word at a time with a highlighted focus point, or guided through full paragraphs. It's a PWA so one codebase runs on phones and desktops, installed from the browser. What to build and why: SPEC.md. Why the technical choices were made: docs/adr/. Known problems and edge cases accepted for now: docs/known-issues.md. Features planned for after v1: docs/future-features.md.

## Working together

- **Never:** expose secrets or tokens (in code, logs, commits or PRs); send readers' texts or data off the device, add tracking, or lose saved data; ship a dependency outside the license allowlist (SPEC.md feature 13).
- **Ask the owner first:** adding, dropping or reshaping a feature, or anything in SPEC.md's Out of scope or docs/future-features.md; changing a line marked "Why: the owner's choice"; and anything that needs the owner's access: GitHub settings and accounts, CI workflow files (your token can't push them), and the dev container or firewall (they take effect only after the owner rebuilds). For access changes, say exactly what to change rather than working around the limit. When you ask, research how established apps and open-source projects do it and recommend that convention.
- **Decide everything else,** including details SPEC.md doesn't cover or gets wrong: take the established convention in its simplest working form, record the reason where the decision lives (SPEC.md, ARCHITECTURE.md, or a new ADR that supersedes an old one) in the same PR, and call it out in the PR. Problems you accept instead of fixing go in docs/known-issues.md; a fix removes its entry.
- If the owner has to correct the same thing twice, propose a line for this file in the current PR.

## Commands

- `npm run check`: typecheck, lint, Prettier format check and unit tests. A Stop hook runs it when you finish a turn and sends failures back to you.
- `npm run e2e`: Playwright against the production build, in headless Chromium and in WebKit with iPhone emulation, inside the container. Run it before opening a PR that changes the UI, and use Playwright screenshots whenever you need to see the UI.

## Structure

- Reading logic (splitting text, focus position, timing, parsing imported texts) is plain TypeScript in `src/core/`, with unit tests and no DOM, React or browser APIs. `src/ui/` renders it and holds no reading logic. This keeps the logic quick and exact to test, which the Stop hook relies on, and lets the UI be reworked without breaking it. Details: ARCHITECTURE.md.

## Workflow

- One issue, one branch `issue-<n>-<slug>`, one PR. Commit, push and open the PR yourself. Never commit to `main` or merge: merging is the owner's review step.
- Plan first and wait for approval when the approach is uncertain or the change spans several files. If the diff fits in one sentence, skip the plan.
- Bugs: write a failing test that reproduces the bug, then fix the cause. Don't suppress errors, weaken tests or special-case around it; the bug would come back in another form.
- Keep each PR inside its issue so it stays reviewable. Mention unrelated problems you notice in the PR instead of fixing them.
- Prefer the platform and packages already in use. If a new dependency is worth it, propose it in the plan with the reason: each one adds download size on phones, updates and license notices.
- Before opening a PR, have a fresh subagent review the diff against the issue for correctness and scope. Fix real gaps and ignore style preferences, since chasing every finding leads to over-engineering.
- PR body: use `.github/pull_request_template.md` and include the commands you ran with their output, so the owner reviews evidence instead of re-running everything.

## When compacting

Keep the issue number, the approved plan, the files changed and any failing tests.
