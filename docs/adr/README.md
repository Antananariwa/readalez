# Architecture decision records

This folder holds the significant technical decisions, one per ADR. Which decisions get one: CLAUDE.md, Writing docs.

Each ADR follows Michael Nygard's format ([Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)), with a Date line added, and runs to one or two pages. Copy [0000-template.md](0000-template.md). An ADR has these parts:

- **Title:** `# N. The decision, as a short phrase`, in a file named `NNNN-the-decision.md`.
- **Date:** the day the decision was made.
- **Status:** `Accepted`. The PR is the proposal, and merging it accepts the ADR, as in the [GDS Way](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html).
- **Context:** the forces at play when the decision was made, with links to what was read, and the options considered.
- **Decision:** what was decided, in full sentences, and why the other options were not chosen.
- **Consequences:** what follows from the decision, good and bad, and when to revisit it.

## Numbers

A new ADR takes the number after the highest one `main` has ever had. Numbers are not reused, so a link to an old number never leads to a different decision. ADRs 0014 to 0017 were deleted in #121, and their numbers are not used again. A number that a branch used and deleted before it merged is free.

## After merge

A merged ADR records a decision as it stood on its date. A line that went out of date stays as written. The ADR changes only in three ways:

- **Its Status line, when a later ADR changes its Decision section.** [adr-tools](https://github.com/npryce/adr-tools/blob/b3279baf9be2207d1a4f4bbd608fd0b591c72aee/src/adr-new#L43-L49) links ADRs as superseded or amended. Here the Status line says it in one of two forms:
  - `Superseded by ADR NNNN`, when the later ADR replaces the whole decision.
  - `Accepted; amended by ADR NNNN, which …`, when it changes or adds to part of the decision, with what it changes after "which". Each further amendment follows, in number order: `Accepted; amended by ADR 0009, which …; amended by ADR 0010, which …`.
- **A dated note under Consequences, when anything else it states changed or was learned later**, such as a host's limit, or a consequence that a later ADR changed: `2026-12-01: …`.
- **A fix of a fact that was wrong when written, or of a link that no longer leads to what it cited.**

A changed decision gets a new ADR, which says which ADR it supersedes or amends.
