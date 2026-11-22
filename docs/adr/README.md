# Architecture decision records

This folder holds the significant technical decisions, one per record. Which decisions get one: CLAUDE.md, Writing docs.

Each record follows Michael Nygard's format ([Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)), with a Date line added, and runs to one or two pages. Copy [0000-template.md](0000-template.md). A record has these parts:

- **Title:** `# N. The decision, as a short phrase`, in a file named `NNNN-the-decision.md`.
- **Date:** the day the decision was made.
- **Status:** `Accepted`. The PR is the proposal, and merging it accepts the record, as in the [GDS Way](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html).
- **Context:** the forces at play when the decision was made, with links to what was read, and the options considered.
- **Decision:** what was decided, in full sentences, and why the other options were not chosen.
- **Consequences:** what follows from the decision, good and bad, and when to revisit it.

## Numbers

A new record takes the number after the highest one ever used. Numbers are not reused, so a link to an old number never leads to a different decision. The highest used is 0017: records 0014 to 0017 were deleted in #121, so the next is 0018.

## After merge

A merged record changes only in:

- its Status line, when a later record changes the decision: `Superseded by ADR N`, or for a part, `Accepted; its browser list is superseded by ADR N`;
- corrections of fact or links;
- dated notes under Consequences, for something learned later, such as `2026-12-01: …`.

A changed decision gets a new record that says what it changes, and the old record's Status line names it.
