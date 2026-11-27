# Architecture decision records

This folder holds the significant technical decisions, one per ADR. Which decisions get one: CLAUDE.md, Writing docs.

Each ADR follows Michael Nygard's format ([Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)), with a Date line added, and runs to one or two pages. Copy [0000-template.md](0000-template.md). An ADR has these parts:

- **Title:** `# N. The decision, as a short phrase`, in a file named `NNNN-the-decision.md`.
- **Date:** the day the decision was made.
- **Status:** `Accepted`. The PR is the proposal, and merging it accepts the ADR, as in the [GDS Way](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html).
- **Context:** the forces at play when the decision was made, with links to what was read, and the options considered, when there were real ones.
- **Decision:** what was decided, in full sentences, and why the other options were not chosen.
- **Consequences:** what follows from the decision, good and bad, and when to revisit it, when something would call for that.

## Numbers

A new ADR takes the number after the highest one `main` has ever had. Numbers are not reused, so a link to an old number never leads to a different decision. The deleted ones are 0010, 0011 and 0014 to 0017. A number that a branch used and deleted before it merged is free.

## After merge

A merged ADR records a decision as it stood on its date. ADRs 0001 to 0009, 0012, 0013 and 0018 to 0020 state theirs as they stood on 2026-11-27 instead (#131). The rules below apply to them from that day. A line that went out of date stays as written. The ADR changes only in three ways:

- **Its Status line, when a later ADR changes what it decided.** [adr-tools](https://github.com/npryce/adr-tools/blob/b3279baf9be2207d1a4f4bbd608fd0b591c72aee/src/adr-new#L43-L49) links ADRs as superseded or amended. Here the Status line says it in one of two forms:
  - `Superseded by ADR NNNN`, when the later ADR replaces the whole decision.
  - `Accepted; amended by ADR NNNN, which …`, when it changes or adds to part of the decision, with what it changes after "which". Each further amendment follows, in number order: `Accepted; amended by ADR NNNN, which …; amended by ADR MMMM, which …`.
- **A dated note under Consequences, when a line went out of date in any other way:** a fact outside the project changed or was learned later, a small change was made without an ADR, or a later ADR changed a fact this ADR rests on but not what it decided. It starts with the day it is written, as in `2026-12-01: …`. No note is needed when the Status line already names the ADR that put the line out of date.
- **A fix of a fact that was wrong when written, or of a link that no longer leads to what it cited.**

A changed decision gets a new ADR, which says which ADR it supersedes or amends.
