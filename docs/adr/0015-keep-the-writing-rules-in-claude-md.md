# 15. Keep the writing rules in CLAUDE.md

Date: 2026-11-15
Status: Accepted

## Context

ADR 0014 chose a published standard for each part of the docs. Its Consequences say that the later steps of #105 "follow the table and link this ADR instead of restating it". #110 then cut CLAUDE.md's Writing docs section to six lines under "follow ADR 0014", and `.claude/agents/reviewer.md` checked diffs against the ADR. So an ADR became the rule book. #118 records what went wrong:

- **A rule there can't be corrected.** An accepted ADR changes only in its Status line (ADR 0001). Each correction would need a new ADR, and the live rules would spread over superseded files.
- **A rule that worked was dropped.** Before #110, CLAUDE.md said: "**Decisions and plans:** say what and why; a preference is a reason. They need no other source." (`git show ca045fd^:CLAUDE.md`). ADR 0014's Prose row still holds the split between facts and "assumptions or judgments", inside one table cell with two other sources.
- **The next step went wrong on it.** #117 reworked SPEC.md under these rules and was closed without merging. It labelled judgments as unchecked facts, as in "Android phones are very common (not checked)", and it wrote where a reason had been given ("given while working on #106").

How other projects split the two:

- Nygard, as quoted in #118: "Each record describes a set of forces and a single decision in response to those forces." A rule book holds many rules and changes often.
- Backstage's [AGENTS.md](https://github.com/backstage/backstage/blob/e2a85555b3a614cfc400f66cb09f403c3055eb9f/AGENTS.md) (77 lines, read with `gh api` on 2026-11-14) says "Changes to the docs should follow the documentation style guide at `/docs/contribute/doc-style-guide.md`", and lists `/STYLE.md` and `/docs/architecture-decisions/` as separate entries. Its [STYLE.md](https://github.com/backstage/backstage/blob/e2a85555b3a614cfc400f66cb09f403c3055eb9f/STYLE.md) is a list of numbered rules without reasons (first 60 lines read). The doc style guide itself was not read.
- #105 read the agent files of uv, Kubernetes and rust-analyzer: they hold commands, constraints, test conventions and pointers to contributor docs.
- Claude Code's [memory page](https://code.claude.com/docs/en/memory): "target under 200 lines per CLAUDE.md file", and "Keep it to facts Claude should hold in every session". It offers `.claude/rules/` and `@path/to/import` for splitting a file up. The fetch tool cut the page near 40,000 of 55,366 characters.

CLAUDE.md was 46 lines before this change.

## Decision

The rules live in three places, each with one job:

| Place                                  | Holds                                                          | Changes how      |
| -------------------------------------- | -------------------------------------------------------------- | ---------------- |
| CLAUDE.md, Writing docs                | Every rule that applies to a sentence in any file              | Edited in a PR   |
| Each doc's intro, and each template    | The shape of that file's entries                               | Edited in a PR   |
| ADRs, this one and ADR 0014 among them | Why a standard or a home was chosen, with what was read for it | Status line only |

CLAUDE.md alone is the home, with no guide beside it. Nearly every task writes a PR, a comment or a test name, so the rules are needed in every session. A pointer to a second file is the step that failed in #117. This differs from Backstage, which points from its agent file to a guide: Backstage's guide serves many human contributors, and here Claude Code writes the docs (ADR 0004).

The section sorts rules by kind of statement: something seen here, what the code does, a fact from outside the repo, a decision or a judgment, a guess, and history. #117's errors came from treating one kind as another.

This supersedes in ADR 0014:

- The Consequences line that steps 2 to 7 of #105 "follow the table and link this ADR instead of restating it". The steps follow CLAUDE.md. A rule a step needs is written in CLAUDE.md, or in the intro of the file it shapes.
- The Consequences line that a step which finds a misfit "proposes a new ADR that supersedes this one". A rule is corrected by editing CLAUDE.md. A new ADR is needed only when a standard chosen in ADR 0014's table is replaced.
- Local rule 2, in part: rules about who may do what still live only in CLAUDE.md and `.claude/agents/`. Writing rules now live in CLAUDE.md too.

ADR 0014's table of chosen standards, its sources and its other local rules stand.

A new rule about how to work or write goes in CLAUDE.md, and its source or reason goes in the PR that adds it. That is ADR 0014's Changes row: the body of a change says what and why.

Local rules added, which no source read gives:

1. **The test for the kind of statement:** if someone could check it by reading or running something, it is a fact; if not, it is a decision or a judgment. Why: ICD 203 (ADR 0014's Prose row) separates the two and gives no test, and #117 sorted "Android phones are common" as a fact.
2. **A decision or a judgment takes no source and no label, and no note of who decided or where the reason was given.** Why: the first half restores the line #110 dropped. The second half is #99, widened by what #117 wrote.
3. **A decision with no reason says so once.** Why: #106 lists one ("A second tap on a word in the paused view doesn't play"), and an invented reason would be a guess written as a fact.
4. **History belongs in the PR.** Why: #106 found history in SPEC.md ("In the first device trial…") among the things that made it long.

## Consequences

- CLAUDE.md grows from 46 lines to 54. Every session pays for the longer section, including sessions that write no docs.
- The reason for a writing rule is no longer beside the rule. It is in this ADR for the rules above, and in the PR for a later one (`git blame CLAUDE.md`).
- Per-file shapes are not gathered in one place. `docs/known-issues.md`, `docs/roadmap.md`, ADR 0001 and `.github/pull_request_template.md` each hold their own already. SPEC.md's is #106's to design.
- `.claude/agents/reviewer.md` checks against CLAUDE.md only.
- Revisit if CLAUDE.md nears 200 lines, or if a rework under these rules repeats #117's errors. `.claude/rules/` with a path scope is then the next thing to try.
