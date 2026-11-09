# Readalez

What Readalez is: SPEC.md's What Readalez is. What to build and why: the rest of SPEC.md, with undecided product questions in its Open questions. Where things are in the code: ARCHITECTURE.md. Why the technical choices were made: docs/adr/. Known problems and edge cases accepted for now: docs/known-issues.md. Ideas for after v1: docs/roadmap.md. Work to do, bugs included: GitHub issues. Each doc's intro says what it holds; docs/known-issues.md's and docs/roadmap.md's also give the shape of an entry, and ADR 0001 gives the ADRs'.

## Working together

- **Never:** expose secrets or tokens (in code, logs, commits or PRs); send readers' texts or data off the device, add tracking, or lose saved data; ship a dependency outside the license allowlist (SPEC.md feature 13).
- **Ask the owner first:** adding, dropping or reshaping a feature, or anything in SPEC.md's Out of scope or docs/roadmap.md; changing a decision whose reason is a preference; and anything that needs the owner's access: GitHub settings and accounts, CI workflow files (your token can't push them), and the dev container or firewall (they take effect only after the owner rebuilds). For access changes, say exactly what to change rather than working around the limit. When you ask, research how established apps and open-source projects do it and recommend that convention.
- **Decide everything else,** including details SPEC.md doesn't cover or gets wrong: take the established convention in its simplest working form, record the reason where the decision lives (SPEC.md, or a new ADR that supersedes an old one) in the same PR, and call it out in the PR. Accepted ADRs aren't edited apart from their Status line: they record what was known when the decision was made, and when the decision changes, a new ADR supersedes the old one. When only a product rule an ADR recorded changes, SPEC.md holds the new rule and the ADR's Status line names it and points there. Problems you accept instead of fixing go in docs/known-issues.md.
- If the owner has to correct the same thing twice, propose a line for this file in the current PR.

## Writing docs

This covers docs, code comments, test names, and issue and PR text. Later sessions build on what's written here, so a guess written as a fact spreads (#42 lists cases).

- **What was seen:** say what happened, where and how often, and link it. Don't widen it into a rule or a cause.
- **What the code does:** name the file or test.
- **What happens outside the repo** (browsers, devices, tools, other projects, laws, prices): link what you read or ran. Our config shows what we asked for, not what happens.
- A fact with no link, file or test counts as not checked, whether or not it's labelled.
- **Decisions and plans:** say what and why; a preference is a reason. They need no other source.
- **Guesses** are welcome, marked as guesses: in an entry's **Suggestions** field, or in the sentence ("Possible cause: …", "(not checked)"). Write "unknown" rather than filling a gap. Once someone checks a guess, rewrite it as what was seen and link the check.
- **One home per fact.** Elsewhere, link to it.
- Rules about who may do what live only here and in `.claude/agents/`.

Examples:

- Not "Updates take two launches, because Chrome keeps running in the background after its window closes", but "After #37 merged, the owner's Chrome still showed the old version after a restart, until Ctrl+Shift+R loaded the new one (#40). Possible cause: the first launch after a deploy still runs the old version and downloads the new one in the background."
- Not "Safari clears a site's data after 7 days without a visit", but "Safari deletes a site's script-writable storage after seven days of Safari use without interaction with the site ([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/))."
- Not "40% is easier to read", but "In the first device trial, a third put 5- and 6-letter words wholly in the left half of the screen; the owner chose 40% as more balanced (#36)."

## Commands

- `npm run check`: typecheck, lint, Prettier format check and unit tests. A Stop hook runs it when you finish a turn, except when `.claude/hooks/check.sh` skips it, and sends failures back to you.
- `npm run e2e`: Playwright against the production build, in headless Chromium, in WebKit with iPhone emulation and in Chromium with Android phone emulation, inside the container. Run it before opening a PR that changes the UI, and use Playwright screenshots whenever you need to see the UI.

## Structure

- Reading logic (splitting text, focus position, timing, parsing imported texts) is plain TypeScript in `src/core/`, with unit tests and no DOM, React or browser APIs. `src/ui/` renders it and holds no reading logic. Why: ADR 0003.

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
