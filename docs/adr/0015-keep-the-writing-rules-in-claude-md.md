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
| CLAUDE.md, Writing docs                | The rules for every text, then the job of each kind of text    | Edited in a PR   |
| Each doc's intro, and each template    | The shape of that file's entries                               | Edited in a PR   |
| ADRs, this one and ADR 0014 among them | Why a standard or a home was chosen, with what was read for it | Status line only |

CLAUDE.md alone is the home, with no guide beside it. Nearly every task writes a PR, a comment or a test name, so the rules are needed in every session. Behind a pointer, #110 kept six lines of the rules, and the line #117 needed was not among them. This differs from Backstage, which points from its agent file to a guide: Backstage's guide serves many human contributors, and here Claude Code writes the docs (ADR 0004).

The section has two parts. The first holds the rules for every text, sorted by kind of statement: something seen here, what the code does, a fact from outside the repo, a guess, and a reason. #117's errors came from treating one kind as another. The second says what each kind of text is for, because a rule that is right for SPEC.md is wrong for a PR: SPEC.md leaves out how a line came about, and a PR is where that is told. CLAUDE.md loads whole in every session, and nothing in it selects rules by file, so the section names the text each line applies to.

This supersedes in ADR 0014:

- The Consequences line that steps 2 to 7 of #105 "follow the table and link this ADR instead of restating it". The steps follow CLAUDE.md. A rule a step needs is written in CLAUDE.md, or in the intro of the file it shapes.
- The Consequences line that a step which finds a misfit "proposes a new ADR that supersedes this one". A rule's wording is corrected by editing CLAUDE.md.
- Local rule 2, in part: rules about who may do what still live only in CLAUDE.md and `.claude/agents/`. Writing rules now live in CLAUDE.md too.

ADR 0014's table of chosen standards, its sources and its other local rules stand as the record of what was chosen. ADR 0014 says "Where the standard has a rule, that is the rule"; each rule its table quotes is now written out in CLAUDE.md, in a doc's intro or in a template, and where they differ, those files hold the live rule. Written out in this change because they were in none of those files: "Change your documentation in the same CL as the code change" and "Default to delete" (Kinds of file), "Do not synthesize meaning from multiple sources" (Prose), one idea per sentence in the active voice (Prose), a UI label in bold where one is quoted (Names; local rule 5 narrows where), the first line of a change "written as though it were an order" (Changes), and the Agent file row's rules for CLAUDE.md itself. That row's "no added emphasis" is written as no emphasis words such as "IMPORTANT", after Claude Code's [best practices](https://code.claude.com/docs/en/best-practices): "If you keep adding emphasis to a `CLAUDE.md` line and Claude still misses it, that's a sign the line belongs in a hook" (read with `curl` on 2026-11-15, searched for "emphasis" and "hook", not read in full). The bold lead-ins in the section are labels, not emphasis. The glossary (Names) waits for #106.

A new rule about how to work or write goes in CLAUDE.md, or in `.claude/agents/` when it is the reviewer's. Its source or reason goes in a new ADR, whether it comes from a standard or is local, so that a rule adopted later is weighed and recorded as ADR 0014's were. A change that only corrects a rule's wording needs no ADR: the PR gives its reason (ADR 0014's Changes row: the body of a change says what and why).

Local rules added, which no source read gives:

1. **A claim inside a reason is checked when it is written, and linked, even when it seems common knowledge. "(not checked)" is for a claim that was tried and couldn't be checked.** Why: #117 wrote "Android phones are very common (not checked)" for a reason the owner gave. The mark was the wrong answer, and so was this ADR's earlier answer in the same PR, that a reason takes no source: a later session could then build on a claim nobody checked. Checking took one page: Android ran on 72.36% of phones worldwide in October 2026 ([StatCounter, October 2026](https://gs.statcounter.com/os-market-share/mobile/worldwide); the page was fetched with `curl` on 2026-11-16 and the figure read from its table). A reason with no source reads as an opinion and may stand as one, as ICD 203 (ADR 0014's Prose row) separates "assumptions or judgments" from information.
2. **A reason is always given; "a preference" or "No reason recorded" only when there is clearly no reasoning to give.** Why: the line before #110 read "a preference is a reason". Offered as an equal choice, it invites writing "a preference" instead of finding the reasoning. #106 lists one decision with no reason ("A second tap on a word in the paused view doesn't play"), and an invented reason there would be a guess written as a fact.
3. **Each kind of text has a job, and SPEC.md leaves out who decided, when or where a reason was given, and history.** Why: #99 for who decided; #117 wrote "given while working on #106" in SPEC.md; #106 found history in SPEC.md ("In the first device trial…") among the things that made it long. For docs/known-issues.md and docs/roadmap.md, CLAUDE.md only points to each one's intro, which already says what the file holds: a second description in CLAUDE.md would be a second home for it. A comment keeps a why that belongs to its code alone (`src/ui/importEpub.ts` has one on `setTimeout`'s clamping), since neither SPEC.md nor an ADR holds it. Google's [code review guide](https://google.github.io/eng-practices/review/reviewer/looking-for.html) says the same: "Usually comments are useful when they explain why some code exists, and should not be explaining what some code is doing."
4. **An issue or a PR holds the path.** Why: what was tried and dropped, and what the owner decided in a session, are recorded nowhere else, and the rule that keeps them out of SPEC.md must not keep them out of the PR.
5. **The words on a button have one home, the code. A doc names the feature by its term and quotes those words only where a reader must find the control on the screen.** Why: #104 records a hunt through docs and code to rename one label. ADR 0014's Names row took Google's "When referring to any UI element by name, put its name in bold"; written out alone, that reads as leave to name labels anywhere. Bold stays for the places that do quote one. The glossary that gives each feature its term is #106's, and #104 stays open until the docs are reworked.

## Consequences

- CLAUDE.md grows from 46 lines to 61. Every session pays for the longer section, including sessions that write no docs.
- The reason for a writing rule is no longer beside the rule. It is in this ADR for the rules above, and in a later ADR for a later one.
- Per-file shapes are not gathered in one place. `docs/known-issues.md`, `docs/roadmap.md`, ADR 0001 and `.github/pull_request_template.md` each hold their own already. SPEC.md's is #106's to design.
- `.claude/agents/reviewer.md` checks against CLAUDE.md only. Two rules are added to it in the same PR, at the owner's request. It reports a finding it isn't sure of as unconfirmed instead of leaving it out. Why: a finding that is probably real would otherwise go unseen, and the author can check it more cheaply than rediscover it. It also reports an overcorrection, and must name the case that was lost. Why: three happened on the way here. #110 cut CLAUDE.md's section and lost the line on reasons. This PR's first commit wrote in CLAUDE.md "Write a new ADR only when the rule replaces a standard that an ADR chose", which left a newly adopted standard with no record. Its third commit put docs/known-issues.md and docs/roadmap.md under "say what is" in CLAUDE.md. The author of a fix looks at the problem being fixed, and a reader coming fresh can see what else the old text did. Naming the case keeps the finding checkable. No source was read for either reviewer rule.
- Revisit if CLAUDE.md nears 200 lines, or if a rework under these rules repeats #117's errors. `.claude/rules/` with a path scope is then the next thing to try.
