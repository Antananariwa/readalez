# 18. Keep ADRs for architecture decisions, correctable after merge

Date: 2026-11-20
Status: Accepted

## Context

ADR 0001 records each significant technical decision in Nygard's format, and a changed decision in a new ADR. CLAUDE.md added that an accepted ADR changes only in its Status line. #121 records what followed:

- ADRs 0014, 0015 and 0016 held documentation rules: a standard for each part of the docs, where the writing rules live, and SPEC.md's format. They were 27.9, 11.6 and 6.2 KB. ADRs 0002 to 0013 are 1.1 to 8.1 KB.
- A rule in an ADR couldn't be corrected in place. ADR 0015 superseded part of ADR 0014 a day after it, and ADR 0016 another part three days after (#118, #106).
- ADR 0017 held SPEC.md feature 6's starting timing values, which the tuning screen (feature 11) is built to change.

What the sources say, read on 2026-11-19 (#121's [investigation](https://github.com/Antananariwa/readalez/issues/121#issuecomment-7040238628) has the quotes and the projects compared):

- **Scope.** [Microsoft](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record): "Only include choices that affect the system's structure, key quality attributes, or are difficult to reverse". [Nygard](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions): decisions that "affect the structure, non-functional characteristics, dependencies, interfaces, or construction techniques".
- **Length and content.** Nygard: "one or two pages long". Microsoft: "Keep records pithy, assertive, on-topic, and factual. Avoid making decision records design guides."
- **Changes after acceptance.** Microsoft and [AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html) keep accepted ADRs append-only. The [GDS Way](https://gds-way.digital.cabinet-office.gov.uk/standards/architecture-decisions.html) allows updating an ADR for clarifications. [joelparkerhenderson](https://github.com/joelparkerhenderson/architecture-decision-record): "In practice, mutability has worked better for our teams", with dated notes. Backstage changed its accepted ADR002 in place ([1db0882](https://github.com/backstage/backstage/commit/1db0882be1f2c9b79dfc4796703a094516377529)), and Primer React updated its adr-016 (primer/react#5663).
- **Templates.** Backstage and Primer React each keep one as ADR number zero.
- **Deleting.** Backstage's [index](https://github.com/backstage/backstage/blob/184acad411be8cfbac126c3a2885cb4740109176/docs/architecture-decisions/index.md) says "Records are never deleted". Nygard keeps a reversed decision, marked superseded.

Alternatives:

- **Append-only, as Microsoft and AWS.** Each correction then needs a new ADR, as ADR 0015 did.
- **Keep ADRs 0014 to 0017, marked as outside the scope.** Their text would stay in `docs/adr/` for each session to read. Most of their rules are already written out in CLAUDE.md, the templates and SPEC.md, whose intro and layout show its item shape.

## Decision

This supersedes ADR 0001.

1. **Scope.** An ADR records one decision that affects the app's structure, quality attributes, dependencies or interfaces, or that is hard to reverse (Microsoft, Nygard). Documentation layout, writing rules and how-to steps fall outside that scope. Product behaviour and its reasons go in SPEC.md. A decision that is small, or covered elsewhere, gets no ADR (joelparkerhenderson).
2. **Shape.** Nygard's, as ADR 0001 used it: Title, Date, Status, Context with the alternatives, Decision, Consequences. One or two pages. `docs/adr/0000-template.md` holds it, as Backstage's and Primer React's number-zero files do.
3. **Changes.** The PR is the proposal, and an ADR on `main` is accepted (GDS Way). After merge, it changes only in its Status line, in corrections of fact or links, and in dated notes under Consequences. A changed decision gets a new ADR that supersedes the old one, and the old one stays, marked superseded. Numbers are not reused (Nygard).
4. **ADRs 0014 to 0017 are deleted.** Nygard keeps a superseded decision for its history. These four fall outside rule 1, so they are not kept as superseded records. Their history is in #109, #118, #106, PRs #115, #119 and #120, and git. ADR 0017's reason moves into SPEC.md feature 6.

## Consequences

- The source or reason for a rule about how to work or write goes in the PR that adds it (CLAUDE.md), not in an ADR. `git blame` on the rule leads to that PR.
- A correction needs no new ADR. An ADR on `main` may then differ from what was first merged, and git history shows each change.
- ADRs 0004, 0005 and 0006 hold how-to steps, which rule 1 leaves out. Moving them is left to a later issue (#121).
- Closed issues, closed PRs and `docs/reviews.md` mention ADRs 0014 to 0017, which are no longer on `main`. The files stay readable at [e1a4626](https://github.com/Antananariwa/readalez/tree/e1a4626/docs/adr).
- Revisit if a correction in place hides a changed decision, or if a documentation rule needs a record of its own again.
