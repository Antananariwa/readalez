// Adds one merged PR's Review section to a log file:
//   gh pr view <n> --json number,title,mergedAt,headRefName,body \
//     | node scripts/append-review.ts docs/reviews.md
import { readFileSync, writeFileSync } from "node:fs";
import { addReview, type Pr } from "./review-log.ts";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/append-review.ts <log file>");
const pr = JSON.parse(readFileSync(0, "utf8")) as Pr;
writeFileSync(file, addReview(readFileSync(file, "utf8"), pr));
