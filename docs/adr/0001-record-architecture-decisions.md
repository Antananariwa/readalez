# 1. Record architecture decisions

Date: 2026-10-27
Status: Accepted

## Context

This project is built mostly by AI agents across many separate sessions. A decision written down without its reasons gets followed blindly, even after the situation behind it changes, and nobody can tell whether it still holds. No other options were recorded when this was decided.

## Decision

Record each significant technical decision as an Architecture Decision Record in `docs/adr/`, in Michael Nygard's format, one decision per file. CLAUDE.md's Writing docs says which decisions get one. `docs/adr/README.md` gives the format, the numbering and how a merged ADR may change.

## Consequences

- The reasons travel with the decisions, so later sessions can judge whether a decision still applies.
- Changing a decision means writing down why, in the same PR as the change.
