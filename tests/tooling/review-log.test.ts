import { describe, expect, it } from "vitest";
import { addReview, reviewSection, type Pr } from "../../scripts/review-log.ts";

const intro = "# Reviews\n\nIntro.\n";
const pr: Pr = {
  number: 7,
  title: "Add a thing (#3)",
  mergedAt: "2026-11-05T10:00:00Z",
  headRefName: "issue-3-thing",
  body: "Closes #3\n\n## What and why\n\nStuff.\n\n## Review\n\n- Fixed: a bug.\n\n## How to test\n\nTry it.\n",
};

describe("reviewSection", () => {
  it("returns the text under ## Review, up to the next heading", () => {
    expect(reviewSection(pr.body)).toBe("- Fixed: a bug.");
  });

  it("keeps ### headings and blank lines inside the section", () => {
    const body = "## Review\n\nFirst round:\n\n### Notes\n\n- one\n";
    expect(reviewSection(body)).toBe("First round:\n\n### Notes\n\n- one");
  });

  it("reads Windows line endings", () => {
    expect(reviewSection(pr.body.replace(/\n/g, "\r\n"))).toBe(
      "- Fixed: a bug.",
    );
  });

  it("returns null when there is no Review section", () => {
    expect(reviewSection("Closes #3\n\n## Reviewers\n\nx")).toBeNull();
  });
});

describe("addReview", () => {
  it("adds the PR's number, title, date, branch and review at the end", () => {
    expect(addReview(intro, pr)).toBe(
      "# Reviews\n\nIntro.\n\n## #7 Add a thing (#3)\n\nMerged 2026-11-05, branch `issue-3-thing`.\n\n- Fixed: a bug.\n",
    );
  });

  it("leaves the log unchanged when the PR is already in it", () => {
    const once = addReview(intro, pr);
    expect(addReview(once, pr)).toBe(once);
  });

  it("doesn't take #70 for #7", () => {
    const log = addReview(intro, { ...pr, number: 70 });
    expect(addReview(log, pr)).toContain("\n## #7 ");
  });

  it("says so when the PR has no Review section", () => {
    expect(addReview(intro, { ...pr, body: "Closes #3" })).toContain(
      "\n\nNo Review section.\n",
    );
  });
});
