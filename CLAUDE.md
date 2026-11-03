# Readalez

What Readalez is: SPEC.md's What Readalez is. What to build and why: the rest of SPEC.md, with undecided product questions in its Open questions. Where things are in the code: ARCHITECTURE.md. Why the technical choices were made: docs/adr/. Known problems and edge cases accepted for now: docs/known-issues.md. Ideas for after v1: docs/roadmap.md. Bugs to fix: GitHub issues. Each doc's intro says what it holds; docs/known-issues.md's and docs/roadmap.md's also give the shape of an entry, and ADR 0001 gives the ADRs'.

## Working together

- **Never:** expose secrets or tokens (in code, logs, commits or PRs); send readers' texts or data off the device, add tracking, or lose saved data; ship a dependency outside the license allowlist (SPEC.md feature 13).
- **Ask the owner first:** adding, dropping or reshaping a feature, or anything in SPEC.md's Out of scope or docs/roadmap.md; changing a decision whose reason is a preference; and anything that needs the owner's access: GitHub settings and accounts, CI workflow files (your token can't push them), and the dev container or firewall (they take effect only after the owner rebuilds). For access changes, say exactly what to change rather than working around the limit. When you ask, research how established apps and open-source projects do it and recommend that convention.
- **Decide everything else,** including details SPEC.md doesn't cover or gets wrong: take the established convention in its simplest working form, record the reason where the decision lives (SPEC.md, or a new ADR that supersedes an old one) in the same PR, and call it out in the PR. Problems you accept instead of fixing go in docs/known-issues.md.
- If the owner has to correct the same thing twice, propose a line for this file in the current PR.

## Writing docs

This covers every doc, and any code comment or test name that states a fact. Text written before PR #43 stays as written until #48 rechecks it; a sentence a PR changes follows this section.

- An entry has a subject (what it's about), context (what is known about it: what was seen, what happened, a decision and its reason) and, if there are any, suggestions (a possible cause, fix or other idea).
- Subject and context are strict. Each statement has a source and says no more than that source. A source is something a reader can go back to and check; link it unless it's in the same doc. The code in `src/core/` and its unit tests are a source for what the reading logic does; how a browser, device, tool or outside service behaves needs a run, an observation or a cited source.
- Anything that goes beyond its source is a suggestion: a conclusion drawn from the source, or a claim nobody has checked, whoever wrote it. When someone checks it, it moves into context, with the check as its source.
- Suggestions are welcome, each in its own labelled field or sentence, never in the subject or the context.
- Anything not known yet is written as open, not guessed.
- A decision stands on its reasons, not on who made it. A line that only says what the app does needs no reason; a reason that's given follows the rules for context. A preference is a reason too, written as one.
- Each fact lives in one doc. Other places name it and link to it rather than repeat it.
- Rules about who may do what live only in this file and in the agent briefs in `.claude/agents/`. A doc's intro says how that doc itself works.

## Commands

- `npm run check`: typecheck, lint, Prettier format check and unit tests. A Stop hook runs it when you finish a turn, except when `.claude/hooks/check.sh` skips it, and sends failures back to you.
- `npm run e2e`: Playwright against the production build, in headless Chromium and in WebKit with iPhone emulation, inside the container. Run it before opening a PR that changes the UI, and use Playwright screenshots whenever you need to see the UI.

## Structure

- Reading logic (splitting text, focus position, timing, parsing imported texts) is plain TypeScript in `src/core/`, with unit tests and no DOM, React or browser APIs. `src/ui/` renders it and holds no reading logic. This keeps the logic quick and exact to test, which the Stop hook relies on, and lets the UI be reworked without breaking it. Details: ARCHITECTURE.md.

## Workflow

- One issue, one branch `issue-<n>-<slug>`, one PR. Commit, push and open the PR yourself. Never commit to `main` or merge: merging is the owner's review step.
- Plan first and wait for approval when the approach is uncertain or the change spans several files. If the diff fits in one sentence, skip the plan.
- Bugs: write a failing test that reproduces the bug, then fix the cause. Don't suppress errors, weaken tests or special-case around it; the bug would come back in another form.
- Keep each PR inside its issue so it stays reviewable. Mention unrelated problems you notice in the PR instead of fixing them.
- Prefer the platform and packages already in use. If a new dependency is worth it, propose it in the plan with the reason: each one adds download size on phones, updates and license notices.
- Before opening a PR, run the `reviewer` subagent (`.claude/agents/reviewer.md`) and put its findings, and what you did with each, in the PR's Review section; a hook blocks `gh pr create` otherwise (`.claude/hooks/pr-review.sh`). Its claims are suggestions until checked. Fix real gaps and ignore style preferences, since chasing every finding leads to over-engineering.
- PR body: use `.github/pull_request_template.md` and include the commands you ran with their output, so the owner reviews evidence instead of re-running everything.

## When compacting

Keep the issue number, the approved plan, the files changed and any failing tests.
