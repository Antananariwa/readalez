# 1. Record architecture decisions

Date: 2026-10-27
Status: Accepted

## Context

AI agents build most of this project, across many separate sessions. A session that meets a past decision without its reasons "has only two choices": "Blindly accept the decision" or "Blindly change it" ([Nygard, Documenting Architecture Decisions](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions)).

Options considered:

- **The reasons in issues and PRs only.** They hold each decision's path: what was asked, tried and dropped ([CLAUDE.md, Writing docs](../../CLAUDE.md#writing-docs)).
- **One design document.** Nygard: "Large documents are never kept up to date. Small, modular documents have at least a chance at being updated."
- **One short record per decision.**

## Decision

- Record each significant technical decision as an Architecture Decision Record in `docs/adr/`, one decision per file, in Nygard's format.
- CLAUDE.md's Writing docs says which decisions get one. [README.md](README.md) gives the format, the numbering and how a merged ADR may change.
- The other options lose:
  - Issues and PRs alone would make a session read a decision's whole path to learn where it ended.
  - One design document would fall out of date, by Nygard's account.

## Consequences

- The reasons travel with the decisions, so a later session can judge whether a decision still holds.
- Changing a decision means writing down why, in the same PR as the change.
- Revisit if sessions get the reasons for past decisions some other way.
