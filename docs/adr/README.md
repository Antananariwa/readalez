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

A new ADR takes the number after the highest one ever used. Numbers are not reused, so a link to an old number never leads to a different decision. ADRs 0014 to 0017 were deleted in #121, and their numbers are not used again.

## After merge

A merged ADR changes only in:

- its Status line, when a later ADR changes the decision, in the two forms [adr-tools](https://github.com/npryce/adr-tools/blob/b3279baf9be2207d1a4f4bbd608fd0b591c72aee/src/adr-new#L43-L49) writes:
  - `Superseded by ADR NNNN`, when the later ADR replaces the whole decision;
  - `Accepted; amended by ADR NNNN, which …`, when it changes or adds to part of the decision, with what it changes after "which";
- corrections of a fact or link that was wrong when written;
- dated notes under Consequences, for a fact that changed or was learned later, such as `2026-12-01: …`.

Nothing else changes, a line that went out of date included: a dated note says what changed. A changed decision gets a new ADR that says which ADR it supersedes or amends.
