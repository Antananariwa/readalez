# 1. Record architecture decisions

Date: 2026-10-27
Status: Accepted

## Context
This project is built mostly by AI agents across many separate sessions. A decision written down without its reasons gets followed blindly, even after the situation behind it changes, and nobody can tell whether it still holds.

## Decision
Record each significant technical decision as an Architecture Decision Record in `docs/adr/`, in Michael Nygard's format: Context, Decision, Consequences. One decision per file, numbered in order. When a decision changes, a new ADR supersedes the old one, which stays for history with its status updated.

## Consequences
- The reasons travel with the decisions, so later sessions can judge whether a decision still applies.
- Changing a decision means writing down why, in the same PR as the change.