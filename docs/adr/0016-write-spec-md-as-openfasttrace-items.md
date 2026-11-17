# 16. Write SPEC.md as OpenFastTrace items

Date: 2026-11-17
Status: Accepted

## Context

ADR 0014 borrowed a standard for each part of the docs except SPEC.md. Its local rule 1 kept SPEC.md's shape: a feature, rule lines each with a "Why:", then Checks. It gave as the reason that "the requirement formats read have no place for a reason". That held for the formats ADR 0014 read. It does not hold for OpenFastTrace or Volere, which #106 then read.

On `main` at df85095, SPEC.md was 352 lines and 9,044 words. #106 found five kinds of text in it: what the app does, how the code does it, history, comparisons with other apps, and checks. Its 74 check lines were 1,697 words. #117 patched the file line by line in the old shape, and it grew to 10,055 words.

#106 compared five formats: OpenFastTrace, Volere's snow card, Gherkin, BCP 14 keywords and OpenSpec. The comparison looked for a place for the reason, a place for the check, a licence that allows use, and a real file in a repo. No study comparing spec formats was found.

What the sources read say belongs in a spec (quoted in #106):

- Behaviour, not implementation. NASA: "Requirements should state WHAT is needed, NOT HOW to provide it" ([SE Handbook, Appendix C](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/)). OpenSpec: "If implementation can change without changing externally visible behavior, it likely does not belong in the spec" ([concepts](https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md)).
- The reason apart from the rule. NASA lists as a defect "a paragraph that contains both requirements and rationale".
- Alternatives and history go in the decision record ([PEP 1](https://peps.python.org/pep-0001/), [Rust RFC template](https://github.com/rust-lang/rfcs/blob/master/0000-template.md)).
- No source read lists tests in the spec. Either the examples are the tests, or the tests point back at the requirement. Here, code and test files already cite "SPEC.md feature N".

## Decision

SPEC.md follows OpenFastTrace's specification item, from [Writing a Specification](https://github.com/itsallcode/openfasttrace/blob/b4d11edb34765c07efbb38895239dbd9d5213f75/doc/user_guide/use_cases/writing_a_specification.md):

- An item is a title and a description. "Requirements should be accompanied by a rationale in all cases where the reason for the requirement is not immediately obvious."
- Plain Markdown text around the items gives context.

OpenFastTrace uses this shape in its own [system requirements](https://github.com/itsallcode/openfasttrace/blob/b4d11edb34765c07efbb38895239dbd9d5213f75/doc/spec/system_requirements.md): 74 items, 28 of them with `Rationale:`, counted with `grep` on 2026-11-17.

It was chosen over OpenSpec and BCP 14 as the simplest of the three: a title, a description and a rationale. It is also the only one of the three with a field for the reason. OpenSpec has a reason only per spec, and its scenarios would restate the tests. BCP 14 puts the reason in the same paragraph as the rule.

What Readalez changes:

1. **No ID line and no keywords other than `Rationale:`.** OpenFastTrace gives each item an ID such as `` `req~name~1` ``, and the keywords `Needs`, `Covers`, `Depends`, `Status`, `Tags` and `Comment`. Why: they feed its tracing tool, which Readalez doesn't run. Code and tests already point back at the feature by number.
2. **Features keep their numbered headings, and each rule under a feature is a heading one level down.** Why: code, tests, docs and open issues cite features by number and by heading anchor.
3. **The rationale is written as `Rationale:` followed by its text, in one paragraph.** The guide's example puts the text on the next line with no blank line between, which Markdown renders as one paragraph. OpenFastTrace's own system requirements put a blank line after `Rationale:`. Why: one paragraph keeps the label with its text, as the guide's example renders.
4. **No checks.** Each check moves to the test that holds it, or, until one does, to the feature's issue. A device check of a built feature moves to the checklist of what hasn't been checked by hand (#74), and one of an unbuilt feature to its issue. The section "How features are checked" stays, and says where checks live. Why: the sources above. Also, `.github/workflows/reviews.yml` cites the heading.
5. **A glossary closes the file.** Why: ADR 0014's Names row puts it in SPEC.md.
6. **Content rules from the sources above.** SPEC.md holds behaviour and its reasons. Code detail leaves when the code or a test holds it. History leaves, since issues and PRs hold it. Where the reason for a rule is a convention, the rationale links one place it is seen. Contrasts with other apps leave, and a decision whose alternatives matter gets its own ADR.

OpenFastTrace's documentation is under GPL-3.0 ([repository](https://github.com/itsallcode/openfasttrace)). SPEC.md takes the item's shape and copies no text. This ADR quotes one sentence, with a link.

This supersedes ADR 0014's local rule 1, and its table row for what the app does ("None. SPEC.md keeps its shape").

## Consequences

- SPEC.md's intro states the shape of an item, as ADR 0015 says each doc's intro does.
- A feature issue lists its own checks as acceptance criteria and no longer points to SPEC.md for them. #106 copied the checks of the features not built yet into their issues.
- A rule with no rationale reads as obvious. When it isn't, the missing reason shows as a gap, not as a sentence to skip.
- The timing values' alternatives move to [ADR 0017](0017-start-timing-at-these-values.md).
- Not read: Volere's paid template, ISO/IEC/IEEE 29148 (HTTP 403 in #106), the EARS paper, and any project other than OpenFastTrace itself that writes its specs this way.
- Revisit if the checks drift from the tests with no list to compare them against, or if a tracing tool is wanted. OpenFastTrace's IDs and `Covers` would then be the next step.
