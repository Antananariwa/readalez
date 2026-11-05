// Builds docs/reviews.md entries from merged PRs' Review sections. The
// workflow in .github/workflows/reviews.yml runs scripts/append-review.ts
// after each merge; tests/tooling/review-log.test.ts tests this file.

/** One PR, as `gh pr view --json number,title,mergedAt,headRefName,body` gives it. */
export type Pr = {
  number: number;
  title: string;
  mergedAt: string;
  headRefName: string;
  body: string;
};

/** The text under the body's `## Review` heading, or null if it has none. */
export function reviewSection(body: string): string | null {
  const sections = `\n${body.replace(/\r/g, "")}`.split("\n## ");
  const review = sections.find((section) => /^Review[ \t]*\n/.test(section));
  if (review === undefined) return null;
  return review.replace(/^Review[^\n]*\n/, "").trim();
}

/** The log with the PR's entry added at the end, or unchanged if it's already there. */
export function addReview(log: string, pr: Pr): string {
  if (log.includes(`\n## #${pr.number} `)) return log;
  const review = reviewSection(pr.body) || "No Review section.";
  const entry = [
    `## #${pr.number} ${pr.title}`,
    `Merged ${pr.mergedAt.slice(0, 10)}, branch \`${pr.headRefName}\`.`,
    review,
  ].join("\n\n");
  return `${log.trimEnd()}\n\n${entry}\n`;
}
