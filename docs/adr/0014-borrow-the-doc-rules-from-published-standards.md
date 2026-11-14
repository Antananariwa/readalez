# 14. Borrow the doc rules from published standards

Date: 2026-11-14
Status: Accepted

## Context

Eight issues and PRs between 2026-11-02 and 2026-11-14 reworked the doc rules or the docs written under them (#34, #42, #44, #49, #51, #54, #82, #99). Before this ADR, CLAUDE.md's Working together and Writing docs sections were 627 words (`wc -w`, at 0640495). #105 holds the full diagnosis.

- **Every decision line had to carry a reason.** CLAUDE.md said "Decisions and plans: say what and why" and "record the reason where the decision lives", and docs/known-issues.md entries had to have **Why it's left**. Six entries there gave "the owner chose…" as the reason or part of it (`git grep -i "owner chose"` at 0640495). #44 had removed the "owner's choice" marker from SPEC.md once.
- **CLAUDE.md's own example** read "the owner chose 40% as more balanced". Possible cause of the marker's return (not checked): agents copy the examples around them.
- **Earlier research was lost.** #54 compared the rules with established projects, but the comparison stayed in its issue body and was redone for #105.

What published standards and other projects do, read on 2026-11-13 and 2026-11-14:

- **Reference docs describe.** Diátaxis: "Describe and only describe" ([reference](https://diataxis.fr/reference/)); design decisions and alternatives belong in [explanation](https://diataxis.fr/explanation/).
- **A change says why in its own description.** Google asks a change description "Why are these changes being made?" ([CL descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html)). Linux asks that a patch's description be self-contained ([Describe your changes](https://docs.kernel.org/process/submitting-patches.html)).
- **Only significant choices get a record,** and the record is not edited later ([Nygard](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)). [MADR](https://adr.github.io/madr/) lists `decision-makers` as optional metadata, apart from "Chosen option: …, because …".
- **Docs stay small, and a fact is written once.** Google's documentation guide: "Minimum Viable Documentation", "Duplication is Evil" ([best practices](https://google.github.io/styleguide/docguide/best_practices.html)).
- **Changes that can be undone go ahead without asking.** Apache: "you don't need to get explicit approval to proceed, but you need to be prepared to listen if someone objects" ([decision making](https://community.apache.org/committers/decisionMaking.html)).
- **Agent files are short and point to the human docs.** Of 30 well-known repositories checked on 2026-11-14 (`gh api repos/<repo>/contents/<file>`, list in #105), 29 had an `AGENTS.md`, `CLAUDE.md` or `.github/copilot-instructions.md`, from 13 to 538 lines. The three read in full ([uv](https://github.com/astral-sh/uv/blob/main/AGENTS.md), [Kubernetes](https://github.com/kubernetes/kubernetes/blob/master/AGENTS.md), [rust-analyzer](https://github.com/rust-lang/rust-analyzer/blob/master/AGENTS.md)) hold commands, constraints, test conventions and pointers to contributor docs, and no rules for sourcing claims or for who decides. Claude Code's docs say to leave out what the agent can find in the code ([best practices](https://code.claude.com/docs/en/best-practices)). A study found that giving coding agents such files "does not generally improve task success rates, while increasing inference cost by over 20% on average" and suggests only instructions that aren't already in the repository ([Gloaguen et al., 2026](https://arxiv.org/abs/2602.11988)).

No proven template for agentic development was found. [AGENTS.md](https://agents.md/) fixes a file name and says "Use any headings you like". [Spec Kit](https://github.com/github/spec-kit), [Kiro](https://kiro.dev/docs/specs/) and [OpenSpec](https://github.com/Fission-AI/OpenSpec) each define a set of files; no evidence of their effect was found.

## Decision

Three rules replace CLAUDE.md's Writing docs section, each taken from the practice above:

- **Docs say what is; the PR says why it changed.** A choice that is costly to reverse gets an ADR.
- **One home per fact.** Elsewhere, link to it.
- **Mark a guess as a guess,** and link the source of anything outside the repo. This one is kept from #54.

Also:

- A doc line may state a decision with no reason. **Why it's left** in docs/known-issues.md is given when there is one.
- Asking first covers scope and access. It no longer covers "a decision whose reason is a preference": a change to an earlier choice goes ahead, and the PR says what changed and why.
- CLAUDE.md no longer repeats ADR 0001's rule that a new ADR supersedes an old one. Two rules that only CLAUDE.md held are dropped with it: that an accepted ADR is edited only in its Status line, and that when only a product rule an ADR recorded changes, the ADR's Status line points to SPEC.md (added in #86). ADR 0001's "stays for history with its status updated" covers the first; the second was a rule for one case.

**Rejected:**

- A spec-driven kit (Spec Kit, Kiro, OpenSpec): more files to keep in step, with no evidence of effect found.
- A fixed set of labels for kinds of reason ("preference", "arbitrary", "for now"). #99 records that the attribution came back after #44; its possible cause (not checked) is that a label which protects a line gets used.
- A reviewer check for changes to earlier decisions. The PR's diff and description already show them.

## Consequences

- CLAUDE.md goes from 1,072 to 769 words (`wc -w`).
- The reason for a doc line is found through the PR that last changed it (`git blame`, then `gh pr view`). A session that doesn't look won't see it.
- An agent can change an earlier choice without asking, unless it is scope or access. The owner sees it in the PR and objects there.
- SPEC.md still carries a "Why:" on 56 of its 187 bullets; #106 applies this ADR to it. #104 and #107 apply "One home per fact" to UI labels and to docs/reviews.md.
- ADR 0001 stands: significant technical decisions still get an ADR with their context.
- Whether this holds is checked by #105: three feature PRs after its sub-issues close, with no change to these rules.
