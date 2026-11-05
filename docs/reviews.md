# Reviews

The `reviewer` subagent's findings on each merged PR, and what was done with each, copied from the PR's Review section (CLAUDE.md, Workflow), in the order added. Each entry gives the PR's number, title, merge date and branch. After each merge, `.github/workflows/reviews.yml` puts every merged PR from #43 on that isn't here yet on the `review-log` branch, as one commit on top of `main`, with `scripts/append-review.ts`. The owner merges that branch by PR. The bot's pushes don't start CI by themselves: if the bot updates `review-log` while its PR is open, the required check waits until the owner approves the run ([GitHub docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), not checked here) or closes and reopens the PR. #43 to #59 were added in #62 with the same script. The 12 merged PRs before #43 have no Review section; 9 of them (#3, #27, #29, #32, #34, #35, #37, #39 and #41) report a subagent review elsewhere in their body. The reviewer's brief (`.claude/agents/reviewer.md`) changed in #50 and #55.

## #43 Say how docs are written, and check it before each PR (#42)

Merged 2026-11-03, branch `issue-42-writing-docs`.

The brief in `.claude/agents/reviewer.md` ran through a general-purpose subagent. It found every acceptance criterion met and the renamed fields' text unchanged. Findings and what I did:

1. `GH_TOKEN=x gh pr create --body x` got past the hook. **Fixed:** `VAR=value` prefixes are matched (test "env prefix, inline").
2. The hook's comment said a mention inside a quoted message isn't matched, but it is after `;` or `&&`. **Fixed:** the comment now says so.
3. A relative `--body-file` is read from the hook's working directory, not after an earlier `cd`. **Accepted:** written in the hook's comment as a limit.
4. ARCHITECTURE.md leaving the Decide tier's list, and "a fix removes its entry" moving, aren't in the acceptance criteria. **Called out** above.
5. "Each doc's intro says … what that shape is" said more than the docs show: docs/adr/ has no intro, and SPEC.md's and ARCHITECTURE.md's intros give no shape. **Fixed:** it now names the docs that give a shape, and ADR 0001 for the ADRs.
6. The brief checked for rules outside CLAUDE.md, but Writing docs didn't say where rules live. **Fixed:** Writing docs now has that line.
7. The template comment repeated part of CLAUDE.md's Workflow bullet. **Fixed:** it now points to CLAUDE.md, Workflow.
8. "A fix removes its entry" in the known-issues intro could read as a rule. **No change:** it describes how that file works, which the line added for finding 6 places in the intro.

## #45 Drop the owner's-choice marker; give each decision its reason (#44)

Merged 2026-11-03, branch `issue-44-decision-reasons`.

`reviewer` still doesn't load as an agent type in this session (`Agent type 'reviewer' not found`), so its brief ran through a general-purpose subagent. It found the acceptance criteria met and nothing changed outside the issue. Findings and what I did:

1. The Desktop line's StatCounter link is a second source not in #44, with no date, and nobody here read the page. **Fixed:** it cites #44 only (see above).
2. The 40% line said why a third failed but not why 40%, so it no longer showed that 40% was a preference. **Fixed:** it now says the owner preferred 40% after the trial (#36).
3. Languages says "the option offered", where #44 says "the option an agent offered". **No change:** the reviewer found it correct, only less specific.
4. MIT's reason was already in SPEC. **No change:** it's not a finding.
5. SPEC.md:278 may be a rule about who may do what. **Noted** above for the audit issue.

## #47 Say when a new version shows, as tested (#46)

Merged 2026-11-03, branch `issue-46-update-wording`.

`reviewer` still doesn't load as an agent type in this session, so its brief ran through a general-purpose subagent. It found all acceptance criteria met and nothing outside the issue. Findings and what I did:

1. The entry's "In a Playwright test in Chromium and WebKit" left out the test's limits. **Fixed:** it says headless, with a relaunched profile standing in for a restart.
2. SPEC.md stated the tested timing for all browsers, without a source. **Fixed:** SPEC.md says "a later launch", and the timing stays in the entry with its source.
3. "The service worker never replaces itself while a page is open" described runtime behaviour, sourced only to config. **Fixed:** it now cites the test (#46).
4. The `e2e/pwa.spec.ts` comment drew a runtime conclusion from code. **Fixed:** it now says what the code shows, that the worker never skips waiting.
5. `vite.config.ts:16`, ADR 0006:40 and the missing E2E check. **Noted** above for the audit issue.

## #50 Narrow Writing docs after the audit (#49)

Merged 2026-11-03, branch `issue-49-narrow-writing-docs`.

`reviewer` still doesn't load as an agent type in this session, so its brief ran through a general-purpose subagent. It found the acceptance criteria met and nothing outside the issue. Findings and what I did:

1. "It needs no reason to be recorded" clashed with "stands on its reasons" and with "Anything not known yet is written as open". **Fixed:** it now says a line that only says what the app does needs no reason.
2. The reviewer brief would flag rules in `.claude/agents/`, including its own. **Fixed:** the brief points to Writing docs, and the issue now covers it.
3. The old-text line could be read two ways: are old sentences exempt, does an edited one follow the rules, and does #42 mean the issue or the PR? **Fixed:** "before PR #43 stays as written until #48 rechecks it; a sentence a PR changes follows this section".
4. "The app's own logic" had no clear boundary for logic built on browser APIs. **Fixed:** it now names `src/core/` and its unit tests.
5. `#42` and `#48` aren't rendered links in a Markdown file. **No change:** the repo's docs cite issues as `#n` throughout, and a reader can open them.

## #53 Fix doc text that is wrong, contradicts, or states rules elsewhere (#51)

Merged 2026-11-03, branch `issue-51-fix-doc-text`.

`reviewer` doesn't load as an agent type in this session, so its brief (`.claude/agents/reviewer.md`) ran through a general-purpose subagent. It found every criterion of #51 met, the Speeedy and speedread citations accurate, and nothing outside the issue. Its five findings, and what was done with each:

1. **README.md:3 repeats SPEC.md:7:** the repeat is in the first sentence, which is from before #43, so it's left as is. The "So far…" sentence now cites #8.
2. **CLAUDE.md, Commands:** "with changes" said less than the code, since the hook also runs on a clean tree when HEAD differs from origin/main. Fixed: the line now points to `.claude/hooks/check.sh` for when it skips.
3. **SPEC.md:277:** "help links" had no source. Fixed: feature 14 is linked. Whether About has other outside links can't be checked until About is built.
4. **docs/roadmap.md, "Stop after a paragraph":** What no longer said how reading goes on after the pause, and Others discusses it. Fixed: Open now asks (a tap or a timer).
5. **docs/known-issues.md, Firefox line:** no change needed.

## #55 Lighter doc rules, built from what established projects do (#54)

Merged 2026-11-04, branch `issue-54-lighter-doc-rules`.

The `reviewer` subagent ran on d6c4956, with the old brief (What and why). It found the diff does what #54 asks and nothing more: the blocks match, nothing else in CLAUDE.md changed, the diff stat lists only the two files, and `npm run check` passes. Its findings, and what I did:

1. **`CLAUDE.md:26`, the Chrome example's possible cause isn't the explanation #40 gives, and #46 has since tested #40's.** Checked with `gh issue view 40` and `gh issue view 46`: true. **Fixed** in e4d04a0, as #54's note on the examples allows (What and why).
2. **`.claude/agents/reviewer.md:10-11, 16`, the new brief makes gaps hard to report.** Step 2 says "Report only these, and only in lines the diff adds or changes", then lists "The diff misses part of the issue"; a missing part has no changed line to give as `path:line`. Read word for word, it can drop the gap findings the old step 2 asked for. **Fixed** in 1255162, after the owner agreed: the limit to lines the diff adds or changes now applies only to breaks of CLAUDE.md, and a gap names the part of the issue it misses instead of a `path:line`.
3. **`CLAUDE.md:26-28`, the examples repeat facts that live elsewhere, against "One home per fact."** The Chrome observation is close to `docs/known-issues.md` ("A restart can still show the old version"). The Safari "Not" text is close to SPEC.md's Install tip ("Safari may clear a site's data after 7 days without a visit"). The 40% example says "chose", where SPEC.md's Fixed spot says "preferred". #54 says the examples are "illustrations, not a second home for those facts", but CLAUDE.md doesn't say so. **Left as given.** For the #48 re-triage: SPEC.md's Install tip sentence is the example's "Not" sentence, and #48 already lists it under kind 5.
4. **`CLAUDE.md:22`, a dropped sentence isn't on #54's list of removals.** The old section ended "A doc's intro says how that doc itself works." The intros of `docs/known-issues.md` and `docs/roadmap.md` still hold how-that-doc-works rules ("A fix removes its entry"). CLAUDE.md's opening map still says "Each doc's intro says what it holds". The reviewer rated this low confidence. **Left as given**; noted so the #48 re-triage doesn't flag those intros as rules out of place.
5. **Not in the diff: `claude agents` doesn't list configured subagents in 2.1.318.** Same as what I found. **Reported** under What and why and Verified.

**Second review**, at 1255162, after the restart (with #54's brief, as above): no findings. It checked the two departures from #54's blocks against #40 and #36 and the reviewer brief's three parts against each other. It also noted, outside the diff, that this PR body still described the old step 2 and that Verified didn't cover 1255162. Both are now fixed.

Not checked by either review: the Safari example against the WebKit post, which doesn't open from the container.

## #56 Link located sources, one home per fact, read unlinked facts as not checked (#48)

Merged 2026-11-04, branch `issue-48-recheck-old-docs`.

**First review:** the `reviewer` subagent, on 3c0e6fc. Every kind 3 to 5 item in the plan had an edit, no ADR changed, and each linked source said what its sentence said. Its findings, and what I did:

1. **`SPEC.md:118`: OpenSpritz had neither a link nor a label.** **Fixed** in 32cb48f with a label, which d0b1446 removed again under the new sentence.
2. **`SPEC.md:23`: webkit.org/b/254545 isn't linked, though the plan listed it.** The linked MDN lines cite that bug. **Left as is.**
3. **`SPEC.md:134`: the SpritzerTextView link missed the length check** (line 214). **Fixed** in 32cb48f: the link covers lines 213–268.

**Design review:** a general-purpose subagent, on 32cb48f, at the owner's request. It reviewed #55 and this PR for clear, light rules and a transparent split between facts with evidence and guesses. It found the rules clear and consistent, and every linked source it opened backs its sentence. Its findings, and what was done (the owner decided 1, 2, 5 and 6):

1. **Labelling only #48's list made unlabelled facts look checked** (for example `SPEC.md:154`, `SPEC.md:24`, `src/ui/styles.css:61`). **Fixed** by the new sentence and by removing the labels; no sweep.
2. **ADRs hold unchecked facts that other docs now point to.** **Left:** ADRs are a historical record, and the new sentence covers unlinked facts in them.
3. **`check.sh`'s new message lost "don't weaken … config",** which CLAUDE.md's Bugs line doesn't cover. **Fixed:** reverted to main's text.
4. **`SPEC.md:261` keeps the sentence CLAUDE.md's Safari example gives as the wrong form.** **Partly fixed:** the unread WebKit link is gone, and under the new sentence the claim counts as not checked. The owner chose not to pursue the post now.
5. **A decision's reason that is a claim about the outside world isn't covered by the rules.** **Left:** the owner judged a rule for it an overcorrection, and the new sentence covers it.
6. **"(not checked)" marked mostly near-certain facts, 24 times in SPEC.md, and the rules give no "cut it" option.** **Fixed** by removing the labels. No cut rule, and no new sources beyond #48's, as the owner decided.
7. **`SPEC.md:134` claimed Readalez's rejoining follows SpritzerTextView.** **Fixed** (What and why).
8. **SPEC.md's "Not checked in v1" (not tested) clashed with the "(not checked)" label.** **Moot:** SPEC.md no longer uses the label.
9. **The labels varied.** **Fixed** where this PR added them (the known-issues entry that marked one guess three ways). Left: "which isn't verified" (`SPEC.md:312`) and "isn't confirmed" (`docs/roadmap.md:17`), which predate #48.

**Second review:** the `reviewer` subagent, on d0b1446.

No findings. It checked the new sentence's wording and place, that the only labels left are the three known-issues judgements, and that `check.sh` and `src/ui/WordFrame.tsx` match main. It also re-fetched `Spritzer.java` at 8c5dd53 and traced "twenty-seven-year-old" to "twenty-", "seven-", "year-old", which the new long-word sentence fits. Outside the diff, it noted that this PR body still described the first round. The body is now rewritten for d0b1446.

## #57 Add text by pasting: paragraphs, Gutenberg text and titles (#9)

Merged 2026-11-04, branch `issue-9-paste-rules`.

`reviewer` subagent findings, and what I did:

1. **Bug:** a heading followed by one paragraph line was joined into one paragraph. With one wrapped line, the median was the heading's own length. **Fixed:** I wrote the failing unit test first ("keeps a heading and one paragraph line as two paragraphs"). `isHardWrapped` now also requires most paragraphs' last lines to fit the wrap width. The related case of two short lines of similar length (`"Hello there\nHow are you?"`) still joins, as SPEC.md's rule says it should. Added to docs/known-issues.md.
2. **Gap:** the issue's End-to-end item about pauses while playing was only unit-tested. **Fixed:** the new e2e test plays the pasted Gutenberg chapter past the first line wrap and checks every word's timing against the original paragraphs. The mutation check above shows the test catches a regression.
3. **Doc rule:** the fixture and a test comment described Gutenberg's files and Safari's Reader view without a source. **Fixed:** both now point to SPEC.md feature 1, where that fact lives.

## #59 Add the reader controls: sentences, speed, keys, auto-pause and screen awake (#10)

Merged 2026-11-05, branch `issue-10-reader-controls`.

`reviewer` subagent findings:
1. Two comments stated browser behaviour without a source: when a page counts as hidden (`Reader.tsx`, `e2e/reader.spec.ts`) and when a wake lock request is refused (`useWakeLock.ts`). **Fixed:** they're now marked "not checked" and point to #10's device checks. The e2e comment now says only what the test does. I tried to read MDN to link it, but the fetch failed (connection refused from the container).
2. The test name "a faster speed applies from the next word" claimed more than it checked: it only changed the speed while paused. **Fixed:** I renamed it "play uses the speed chosen while paused" and added "a speed change while playing applies from the next word", with exact timings.

The reviewer found no problems in the code.

Second round, on the owner-feedback commit:
1. SPEC.md said "holding is how steppers usually work" with no source. **Fixed:** it now gives only the decision, as the owner's choice.
2. `RepeatButton.tsx` said a long press opens a menu, with no source. **Fixed:** the comment now says this is not checked on devices.

The reviewer also checked with a throwaway Playwright script: Enter on a button gives a click with `detail` 0, and a mouse click gives 1, in Chromium and WebKit. In Chromium, a touch tap steps only once. Touch taps in WebKit are not checked. It found no code problems.
