# Reviews

The `reviewer` subagent's findings on each merged PR, and what was done with each, copied from the PR's Review section (CLAUDE.md, Workflow), in the order added. Each entry gives the PR's number, title, merge date and branch. After each merge, `.github/workflows/reviews.yml` puts every merged PR from #43 on that isn't here yet on the `review-log` branch, as one commit on top of `main`, with `scripts/append-review.ts`, and opens a PR for that branch when none is open. The owner merges it. The bot's PRs and pushes don't start CI by themselves: the required check waits until the owner approves the run ([GitHub docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), not checked here) or closes and reopens the PR. #43 to #59 were added in #62 with the same script. The 12 merged PRs before #43 have no Review section; 9 of them (#3, #27, #29, #32, #34, #35, #37, #39 and #41) report a subagent review elsewhere in their body. The reviewer's brief (`.claude/agents/reviewer.md`) changed in #50 and #55.

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

## #63 Collect each merged PR's review in docs/reviews.md (#62)

Merged 2026-11-05, branch `issue-62-review-log`.

`reviewer` subagent findings, and what I did.

First round, on 4f981bb:
1. **Fixed:** the workflow's `git push` to `main` would be rejected by `main`'s ruleset (PR rule, no bypass actors). Checked with `gh api .../rulesets/25832236`. The workflow now pushes to the `review-log` branch, after asking the owner.
2. **Fixed:** `concurrency` cancels a pending run by default ([GitHub docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)), so a review could be dropped. Each run now adds every missing PR, so the next run catches up.
3. **Fixed:** the push failed if `main` moved after checkout. Same catch-up; the push is now a force-push to `review-log`.
4. **Fixed:** "PRs before #43 had no review" was untrue; several reported a review in their body. Reworded.
5. **Fixed:** file names differed from the issue. The issue now names them, and What and why calls it out.

Second round, on cdb5869:
1. **Fixed:** with the `review-log` PR open, a bot push starts no CI, so the required `build (24.x)` check could block the merge. The reviewer says CI never runs; GitHub's [trigger-a-workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow) page says such a `synchronize` run waits for approval. Neither checked here. The intro now gives both ways out: approve the run, or close and reopen the PR.
2. **Fixed:** "some report a review elsewhere" had no source. The intro now names the 9 PRs the reviewer found (#3, #27, #29, #32, #34, #35, #37, #39, #41).

## #66 Have the review-log workflow open its PR (#65)

Merged 2026-11-05, branch `issue-65-review-log-pr`.

`reviewer` subagent: no bugs, nothing outside #65. One finding:

1. **Fixed:** criterion 1 can't be seen while #64 is open, because the workflow would update #64 instead of opening a PR. Owner steps now say to merge #64 first, and list the settings switch next to the file commit.

It also read GitHub's trigger-a-workflow page and found it supports the intro's sentence on approval. No change: the sentence still says "not checked here", since nothing has run in this repo yet.

## #68 Add the paused view, progress bar, time left and Finished card (#11)

Merged 2026-11-06, branch `issue-11-paused-view`.

The `reviewer` subagent made three findings. I checked each one and fixed all three:

1. **The progress bar stopped following the word after a drag let go where it started** (`src/ui/ProgressBar.tsx`). The browser fires no `change` event then, so the dragged value stayed in place. Reproduced in both engines with a new failing test ("the bar follows the word again after a drag let go where it started"). Fixed: the bar records its value on `pointerdown`, and letting go at that same value hands the bar back to the word.
2. **A tap on the left part of a word's first letter, right after a dash, picked the word before** ("yes—nothing"). Reproduced in both engines with a new failing test ("tapping the start of a word right after a dash picks that word"). Fixed: the UI now works out the character under the point from the caret and the box of the character after it (`characterAt`), and core's `wordAtOffset` became `wordAtCharacter`.
   - Still left, from reading the code: a tap on the left edge of the marked word itself, right after a dash, can still pick the word before. The owner chose to leave it, and it's recorded in `docs/known-issues.md`.
3. **SPEC.md pointed to "the timing check below", which is in feature 6, above.** Fixed: it now links to feature 6.

Also added: a test of taps with `caretPositionFromPoint` removed ("without caretPositionFromPoint, as in Safari before 26.2"). Playwright's Chromium and WebKit both have both APIs, so the `caretRangeFromPoint` fallback that iOS 18.4 uses wasn't tested before.

**Second review**, after the owner's review changes (resume at the word on screen, Back, hidden time left, word count). No correctness bugs found. Four findings, all checked and fixed:

1. SPEC.md feature 7 said "as it does in some other readers" with no link. It now links the roadmap entry that cites them.
2. The same fact about rsvp-speed-reader's second tap was in both `docs/known-issues.md` and `docs/roadmap.md`. Kept only in the roadmap.
3. The roadmap entry used "Other apps" where the file's entry shape says "Others". Renamed.
4. SPEC's check says ← from mid-sentence goes to that sentence's start, but no test pressed ← from mid-sentence. Added to "buttons and arrow keys move by a sentence and change the speed" (`e2e/reader.spec.ts`).

Also noted: `sentenceStart` (`src/core/sentences.ts`) had no caller left after the resume change. Removed, with its test lines.

After the fixes: `npm run check` gives 286 passed; `npm run e2e` gives 68 passed (1.1m).

## #72 Keep texts in a library on the device (#12)

Merged 2026-11-06, branch `issue-12-library`.

The `reviewer` subagent found no bugs and nothing outside the issue's scope. It made four findings about the Writing docs rules, and I fixed all four in 6a5e018:

1. ADR 0007 stated facts about localStorage and IndexedDB with no link. I reworded them and marked them as not checked: the firewall blocks web pages (#71).
2. `styles.css` claimed Apple's 44-point tap target with no link. The comment now points to the reader's existing 44px buttons, and the value is `44px` like theirs.
3. `styles.css` copied the comment on the textarea's 16px font size. It now says "as for the textarea", as the existing input rule does.
4. `bookId.test.ts` claimed which values FIPS 180-4 is "usually checked with", with no source. I removed it. The expected values are attributed to Node's `crypto.createHash`.

Second run, on the whole branch after the owner's feedback (hover styles in 92480f6, performance targets moved to #73 in 4259218): no bugs, no gaps against #12, nothing out of scope. One finding:

5. The hover comment in `styles.css` stated as fact that iPhone doesn't report hover and that a tap would leave the style behind, with no link. Fixed in 9ec9ca0: reworded as intent and marked not checked.

## #75 Save reading positions and show progress in the library (#13)

Merged 2026-11-07, branch `issue-13-positions`.

Reviewer subagent: no bugs, no gaps against #13 except the resume rule above. Three minor findings, all fixed in the second commit:

1. Books stored before #13 show no progress, and this wasn't in docs/known-issues.md. **Fixed:** entry added.
2. `onBack`'s comment said "once the position is saved", but it also runs after a failed save. **Fixed:** the comment now says the save "has finished or failed".
3. The reason for the 2 s interval was written in both SPEC.md and `useSavePosition.ts`. **Fixed:** the comment now points to SPEC.md feature 4.

Second review, of the whole branch after those fixes (asked for by the owner): no bugs and no gaps against #13. It re-ran `src/core/position.test.ts` (8 passed) and recomputed ADR 0008's figures: 8 factors and 2,407 words in the fixture, so 200 copies make 481,400 words. One minor finding:

4. ADR 0008 named "the Jekyll and Hyde fixture" without its file. **Fixed:** it now names `src/core/fixtures/storyOfTheDoor.ts` (third commit).

## #77 Lock and dim the progress bar while words play (#76)

Merged 2026-11-07, branch `issue-76-lock-progress-bar`.

Reviewer subagent: no findings, no bugs.
- It checked each acceptance criterion against the diff and the tests.
- It ran the three bar tests 3 times each: 18 passed in both browsers.
- It confirmed the Chromium and WebKit mid-drag behaviour with a probe of its own, twice per browser.
- Its one note, that in Chromium only a Space press mid-drag still moves the place once, is described above. No change made.

## #81 Import EPUB files (#14)

Merged 2026-11-08, branch `issue-14-import-epub`.

The `reviewer` subagent found no code bugs. It found:

1. **Real gap, fixed in 132a959.** docs/known-issues.md and ADR 0009 said an unusual namespace prefix loses author roles. But `attributesNamed` in `src/core/epub/package.ts` matches `role` under any prefix, so roles survive. Meanwhile the nav's `toc` needs the literal `epub:type` (`src/core/epub/toc.ts`), so the chapter list falls back to the NCX or headings. The entry and the ADR now say this.
2. **Owner decision: no fixture has notes**, which the issue's fixture note asks for. Already decided: notes are left to #15, as noted on #15 and in the fixtures README.
3. **Minor: ADR 0009 gave an unlinked timing** (35 ms for *A Christmas Carol*). The reviewer measured 10 ms. I removed the number from the ADR and put a timed run with its command context in Verified above.

It also checked, and found right:
- the chapter lists of all six fixtures, against Python's ElementTree reading of each nav or NCX;
- every README claim (hashes, sizes, dates, versions, class counts);
- that the New mark clears where SPEC.md says;
- that ADR 0003 changes only on its Status line.

## #83 Simplify the docs and issues so they match the app and each other (#82)

Merged 2026-11-09, branch `issue-82-simplify-docs`.

**First review** (commits 033d09d and 59214ea). The `reviewer` subagent found six problems:

1. **Real, fixed in 59214ea.** Shortening feature 3's editions to "without their images" would have kept Alice's frontispiece and list of illustrations, which Standard Ebooks' Alice has (`frontispiece.xhtml`, `loi.xhtml`). The chapter list would then have listed them. The clause is restored.
2. **Real, fixed.** Gutenberg's license rule moved to the roadmap, but `tests/fixtures/epub/README.md` cites SPEC.md for it, and the fixtures need it now. It's back in SPEC.md.
3. **Real, fixed.** The catalog rules moved to the roadmap had no source. They're now marked not checked.
4. **Real, fixed on #15.** #15 said the chapter question also covers the progress bar, but feature 7 and `src/ui/Reader.tsx` make the bar cover the reading flow. Dropped from #15.
5. **Real, fixed.** The copyright rule's reason ("a fixed number of years… ruled out ordinary public-domain books") is restored.
6. **Two points.**
   - The help-note change is called out above for the owner.
   - Notes skipped in place weren't covered by feature 4's progress rule. It's now an open point in #15.

It checked the changed text against the code (`App.tsx`, `AddText.tsx`, `Library.tsx`, `timeLeft.ts`, `Reader.tsx`) and against the issue bodies, and found no other conflicts. No links point to the removed build-order anchor.

**Second review** (be5747f, the owner's changes, and the branch as a whole). It found four small problems, all fixed in 66678e2:

1. **Real, fixed.** Feature 12's check "once a book is saved" could be met by the built-in books on first run, which would settle #22's open question early. It now says "once one of your own books is saved".
2. **Real, fixed.** Feature 14 had two "Why:" sentences in a row. The copyright reason is now part of the note's sentence.
3. **Real, fixed.** The known-issues Copyright section said "No code yet" but describes how paste and import behave. It now names `src/core/paste.ts`, `src/core/epub.ts` and `src/ui/AddText.tsx`.
4. **Real, fixed.** This PR body still said #22's storage question was answered, and its Verified output predated be5747f. Both are updated.

It confirmed that the known-issues anchor resolves on GitHub, that the new entry follows the known-issues format, and that #22, #24 and the roadmap agree with the new text.

## #87 Test Android Chrome by emulation on every PR (#84)

Merged 2026-11-09, branch `issue-84-android-emulation`.

**First review** (7cf8923). The `reviewer` subagent found four problems, all fixed in 7468585:

1. **Medium, real.** The roadmap said the PWA "already runs in Android Chrome", but it has only been run by emulation. It now says SPEC.md supports it.
2. **Low, real.** The owner's reason had lost "reliably" from #84 in SPEC.md, ADR 0010 and known-issues. It is restored in all three.
3. **Low, real.** "Safari on Mac and iPad run the same engine as iPhone Safari" had no source. It is now marked not checked.
4. **Low, real.** ADR 0010 described what Chromium does from the preset values alone. It now says the presets ask for those values, and that what emulation catches is expected but not checked beyond the tests passing.

It also checked, and found correct:

- every preset value against `devices[...]`;
- the Chrome version (`chrome-headless-shell --version`);
- the MDN data, where `chrome_android` is "mirror" for DecompressionStream, TextDecoder and WakeLock;
- that no e2e test skips by project;
- that nothing in the PR states #85's shape;
- that there are no stale browser mentions elsewhere.

**Second review** (the whole branch, 7cf8923 and 7468585, and this PR body):

- It found no problems in the diff. All four fixes hold, and they added nothing new.
- **Low, real, fixed.** The PR body didn't mention two SPEC.md edits: What Readalez is now says Android, and the store-app sentence changed. Both are now listed under What and why.
- It rechecked the preset values, the Chrome version, the MDN files (fetched with `gh api`) and the anchors.
- It ran `npm run check` (393 tests passed) and `npx playwright test --project android-small --project android-large` (98 passed in 55.1s).
- It didn't re-measure the 360 px screenshot values, which come from a script that isn't in the repo.

## #88 Fix the gaps found reviewing #83 (#86)

Merged 2026-11-09, branch `issue-86-docs-follow-ups`.

**First review** (2e378bb). The `reviewer` subagent found three problems, all fixed:

1. **Medium, real, fixed in 3cd6f26.** The CLAUDE.md sentence as first written ("A Status line may name what changed and where the decision now lives") contradicted the sentence before it and ADR 0001. It's now narrowed to product rules an ADR happened to record.
2. **Medium, real, fixed in 3cd6f26.** The 360 px measurement read as a fact about Android. It now says "in the container's Chromium" and keeps #87's font caveat.
3. **Low, real, fixed in a3d0015.** The #48 citation didn't match what #48 says. My first fix quoted wording the test no longer has, so a3d0015 describes what #48 actually changed.

It also checked, and found correct: every quote against its pinned source, the Playwright preset values, the history of the 375 px rule, and that no anchors broke.

**Second review** (the whole branch, 2e378bb to a3d0015, plus #15 and #22 on GitHub):

- It found no problems.
- It confirmed the narrowed CLAUDE.md sentence no longer conflicts with the sentence before it or with ADR 0001. ADR 0001 covers technical decisions. "Same text twice" is a product rule, which ADR 0007 itself calls "the owner's choice".
- It rechecked the sources, and both issue criteria and the SPEC.md bullets they point to.

## #89 Start EPUBs where the author's text starts, with chapters and notes (#15)

Merged 2026-11-10, branch `issue-15-reading-flow`.

`reviewer` subagent findings, and what I did:

1. **High: playing the last skipped part (license, colophon, notes) to its end showed the Finished card and marked the book finished.** Fixed: `nextWord` returns "stop" at the end of any skipped part. The test now says it stops and doesn't finish.
2. **Medium: a table-of-contents link without a fragment to a notes-only document pointed at the next document.** Fixed in `locator` (`src/core/epub.ts`), with a test.
3. **Medium: a book whose text sits under a heading with its own title read whole, Gutenberg's header and license included.** Fixed: when the title rule leaves no author's part, it gives way. Tested with a short-story layout.
4. **The notes acceptance criteria aren't met without a notes fixture.** Agreed; listed under **Still open**.
5. **Doc claims widened or unlinked:** SPEC feature 7's "Gutenberg's EPUB 3 files…", and ADR 0011's "six fixture books" and _Moby Dick_ claim. Fixed: rewritten to what was checked, with links, plus a new test that _Moby Dick_'s chapters 1–7 share section 1.
6. **Which entries are skipped was worked out in `Reader.tsx`.** Moved to core as `skippedEntries`; the fixture test uses it too.

Second review, of the commits after bc37821 (the new fixture):

1. **Medium: the docs, a test name and this body said "two footnotes written into the paragraphs".** The book has three `*` notes, one inside its paragraph and two as their own paragraph, plus a bracketed gloss. Checked in the XHTML and fixed; the test now checks all three.
2. **Low: the known-issues entry on plain-text markers said no fixture has notes, and overlapped the new entry.** Merged into one entry.
3. **Low: the README said the title page has the author's real name, which no test checks.** Removed.
4. **Low: the README said the owner downloaded the file on the commit's date.** Reworded as downloaded and added on that date, like the other fixtures.
5. **Before merging:** this body still said the criteria wait for a fixture; rewritten after the owner's decision. The 26 MB original stays out of `main` only with **Squash and merge**; I couldn't check the repo's merge settings (`gh api` was denied).

## #94 Update README, with screenshots (#92)

Merged 2026-11-10, branch `issue-92-readme`.

`reviewer` subagent findings, and what I did:

1. **Low (first review): the "What works today" bullets repeated exact facts that live in SPEC.md, with no file named** (speed 100–1,000 in steps of 10 from 300, words over 13 letters split, Node.js 24). Fixed: the long-word and timing bullets link to SPEC.md features 5 and 6 without the numbers, and the Node.js line links `.devcontainer/Dockerfile`.

It found nothing else:
- Every claim checked out against code or tests.
- Every linked path exists, and the image sizes are fine.
- The images it opened show what their alt text says.
- It knows of nothing in the HTML (`align`, `<picture>`, `<sub>`, `width`) that GitHub fails to render.

Final review, of bf1679b after the "How it's built" rewrites: no findings.
- Every link resolves, including ADR 0004.
- ADR 0004 backs both claims in the second paragraph.
- Nothing in the repo depends on the removed attribution sentence: ADR 0004's "no attribution, since the README discloses AI use once" still holds, because the README still says agents write most of the code.
- This description matches the README.

## #95 Open web ports in the dev container firewall (#71)

Merged 2026-11-11, branch `issue-71-open-web-ports`.

The `reviewer` subagent ran on the first commit. It found that everything the owner asked for is in the diff, plus five problems:

1. **The "refused" checks couldn't tell the firewall's refusal from the far end's.** Any connection failure within 10 s passed: `127.0.0.1:1` failed in 3 ms with "Connection refused", and the comment widened one measurement into a rule. **Fixed:** `check_rejected` now passes only if the REJECT rule's packet counter (`iptables-save -c`) goes up during the attempt. The comment is gone.
2. **ADR 0004's "both `Firewall verification passed` lines" is out of date;** the log now shows four. **Fixed:** ADR 0012's Consequences says to look for all four.
3. **ADR 0012 claimed more is blocked than is.** DNS (UDP 53) stays open to any address, and every port on Docker's network (`172.17.0.0/24` here) stays open, both from ADR 0004. **Fixed:** ADR 0012 says so. DNS stays open on purpose: the resolver, `192.168.65.7` (`/etc/resolv.conf`), is inside `192.168.0.0/16`.
4. **"No merge" has no source and looks wrong.** The token has Contents and Pull requests write (ADR 0004). `main`'s ruleset requires a PR and a passing `build (24.x)` but no approval. The only block seen is Claude Code's deny rule, which a steered session could get around through GitHub's API. Not tried. **Fixed in the docs:** ADR 0012 and `docs/known-issues.md` now say the token can probably merge. **Not fixed:** closing the gap needs a GitHub settings change, which is the owner's; see Owner decision below.
5. **ADR 0006 says the agent can't check Cloudflare deployments,** which is no longer true. **Fixed:** ADR 0012's Consequences says it can now. ADR 0006 stays as it is (accepted record).

The new reviewer bullet named these changes for the owner to look at:

- `.claude/agents/reviewer.md` (the bullet itself);
- `.devcontainer/init-firewall.sh` (SSH removed, private ranges rejected, 80/443 opened, checks rewritten);
- `.devcontainer/Dockerfile` (comment only);
- `CLAUDE.md` (the Web research line).

There are no dependency changes and no app code that sends data or reads tokens.

### Owner decision: merging

The token acts as your own GitHub account, so GitHub can't tell the agent's merge from yours. The usual fix gives the agent its own identity, a separate machine account or a GitHub App, and then requires your approval on `main`. I can open an issue for it if you want.

## #97 Refuse copy-protected and damaged EPUBs, and show import progress (#16)

Merged 2026-11-11, branch `issue-16-epub-drm-broken-long`.

The `reviewer` subagent made 7 findings:

1. **The branch carried #71's two commits, already squash-merged to main as `d91725d`.** Fixed: rebased onto `origin/main`, and the full e2e suite was run again.
2. **SPEC.md, the known issue and a code comment said taps wait during an import.** It typed into the paste box mid-import in Chromium and WebKit, and that worked. Fixed: the wording now says the page gets a turn between splitting steps, and that the other steps are not checked.
3. **Bug: Back mid-import, then opening a book, got you pulled out of it when the import ended.** Fixed: Back is disabled while importing, with an e2e check that failed first.
4. **#16's "page stays responsive" criterion isn't met.** Called out above as the owner's choice.
5. **SPEC said any damaged file inside is caught, but only the files Readalez reads are.** Fixed: SPEC is narrowed and says damaged images, styles and fonts go unnoticed.
6. **`encryption.ts` credited calibre's DRMError to `process_encryption`; its caller raises it.** Fixed: the comment is corrected, with a link to L317-318.
7. **Unlinked outside facts: what a Kindle file gets on import, and `requestAnimationFrame` in hidden pages. The "(#16)" timing citations led nowhere.** Fixed:
   - The Kindle and hidden-page claims are dropped. The comment now names what was seen with the paused clock.
   - The timings and the command are in this PR body. The docs cite this PR.

The reviewer also checked these and found them correct:
- **CRC with data descriptors (bit 3):** it rezipped two fixtures that way, and all 7 fixtures still read.
- **DRM paths:** they resolve from the container root, as EPUB 3.3 says.
- **Links:** every pinned line link matches its comment.

## #98 Ship 24 built-in books under a Public chip, with library filters (#17)

Merged 2026-11-13, branch `issue-17-built-in-books`.

The `reviewer` subagent ran four times: on the whole branch at cc1c562, then on 88d89ff, the one commit after it that changes behaviour.

**Fourth run, 88d89ff only:** no bugs.
- **Checked, all fine:** the promise always settles, React's StrictMode double run, updates with an old worker active, and failure detection.
- **WebKit check:** in a scratch run, the 4 s delay on `sw.js` held up `register()` in WebKit too, so the new test isn't passing there by accident.
- **Fixed: one comment claimed more than the spec says** (4c6cb4a). On later visits, `register()` returns the existing registration rather than installing again.
- **Already the case before 88d89ff, not fixed:** if a new version's install fails while an old worker is active, the band shows "saving" until a reload. The previous code did the same.
- **Possible race, not reproduced:** on a later visit, the first count of saved books can finish before `register()` resolves. The reviewer measured a 1 ms margin in Chromium. The band never showed on later visits in any run, including with the CPU slowed up to 10×.

**Third run, the whole branch:**

- **Fixed: the band said saving failed when `sw.js` was merely slow.** The reviewer reproduced it with a 2 s and a 5 s delay on the script. A failing e2e test with a 4 s delay reproduced it in all four browser setups. The band now waits for the page's own `register()` call (`serviceWorkerRegistration()` in `src/ui/registerServiceWorker.ts`). It fails only if `register()` fails, or if the registration ends up with no worker. The Service Worker spec's Install algorithm sets the installing worker before it resolves `register()`, so no worker left means the install failed (88d89ff). `e2e/builtInBooks.spec.ts` passed 93 of 93 with `--repeat-each=3`, with 3 WebKit skips.
- **Fixed: internal names left over from "Free shelf".** `BookSource` is now `"public" | "mine"`, and the chips' type is `LibraryFilter`.
- **Fixed: the WebKit skip reason** cited a known issue about something else. It now says what was seen: in WebKit the route didn't stop the worker's download.

**Second run, on the chips and offline band (c15bb4d):**

**Second run, on the chips and offline band (c15bb4d):**

- **Fixed: the band could stay on "Saving…" for the whole visit.** It happened when the service worker's install failed, for example when the network dropped partway: the worker is discarded, and the page never registers again. A failing e2e test reproduced it, and the hook now notices the missing worker and shows the failure (3060bd1). I checked the reviewer's reading of the Service Worker spec on the spec itself: a failed install marks the worker redundant and removes a registration with no other worker.
- **Fixed: two SPEC lines linked #17 for things #17 doesn't record**, the confusing chips and the failed offline try. The iPhone test notes are now a comment on this PR, and SPEC links that.
- **Fixed: three code comments stated outside facts with no source.** They now link Workbox's `createCacheKey` at v7.4.1 and the Service Worker spec's installation algorithm. The private-window case is marked as not checked.

**First run:**

- **Fixed:** SPEC.md feature 3 gave Standard Ebooks' Poe and O. Henry word counts with no link. Now each links its `content.opf` line at a pinned commit (53ab657).
- **For the owner to look at (ADR 0012):**
  - `package.json` adds the `books` script. Dependencies are unchanged.
  - `scripts/build-books.ts` downloads from `codeload.github.com` and runs `tar` in a temporary folder. It runs only by hand, not in the build or the app.
  - `src/ui/App.tsx` fetches `books/<slug>.epub` from the app's own origin. The e2e test checks no request leaves the origin.
  - `vite.config.ts` precaches the books, about 4.2 MB more on the first visit.
- **Also checked by the reviewer:** all 25 Wikidata death years, the precache list in `dist/sw.js`, the zip headers, and the `STARTS` table, by dumping three books' reading-flow parts.

## #115 Record the standard chosen for each part of the docs (#109)

Merged 2026-11-14, branch `issue-109-doc-standards`.

The `reviewer` subagent ran on the first commit. Two findings, both fixed in the second commit:

1. **Ideas for later row:** it said the roadmap's fields were taken from the Rust RFC template in #54. The reviewer's `git log -S` showed Others predates #42, and Open and Suggestions came with #42, before #54. Fixed: the row now says the fields were not taken from the template, and what #54 noted.
2. **Volere:** it named Description and Rationale as fields, but the linked page has only "Fit Criterion" in its text. Fixed: the line now quotes the Fit Criterion sentence and says the reason field is not checked.

Two notes, also acted on:

- ICD 203's PDF returned HTTP 403 to the reviewer's `curl` from both addresses; it confirmed the quote in a Wayback Machine copy. The ADR now says so.
- req42's "12 sections" linked a page that doesn't list them. The link now goes to the page that does.

The reviewer confirmed the other quotes against their pages, the repo claims, the five columns and eight parts against #109, and that nothing on ADR 0012's list changed. The second commit was not reviewed again.

## #116 Rewrite the agent instructions to ADR 0014's standard (#110)

Merged 2026-11-14, branch `issue-110-agent-instructions`.

The `reviewer` subagent reviewed the first commit (614 words). It named both changed files for the owner, as ADR 0012 asks for `CLAUDE.md` and `.claude/`. Findings and what I did:

1. **The glossary line pointed to a glossary SPEC.md doesn't have.** Fixed: the line no longer names it (see above).
2. **"A Stop hook runs it when you finish a turn" said more than the hook does**, which skips on a clean tree at origin/main. Fixed: the sentence is gone.
3. **"Read official docs, standards and the maker's own pages first" was dropped, and ADR 0012 lists it as one of its two light checks.** Fixed: restored.
4. **Rules lost with no other home.** Restored three: check the reviewer's claims and ignore style preferences; record the reason where the decision lives; "GitHub settings and accounts". Left out three, listed above under Dropped; a fourth, researching conventions when asking, was restored in the third commit after the owner's comment.
5. **ADR 0009 cites CLAUDE.md for "each dependency adds download size on phones, updates and license notices".** Fixed: the reason is back on the dependency line. ADR 0004's auto-memory reason: no change needed, see above.
6. **"A new rule needs a published source" contradicted ADR 0014's own local rules.** Fixed: a new rule goes in a new ADR with its source or, when there is none, its reason.

The reviewer found no other file citing a removed heading. A second review, by the `reviewer` subagent run on Opus 5.5 at high effort, covered the whole diff after the third commit. One finding: the no-new-rule line, read literally, also covered product rules in SPEC.md (against the line above it) and sent every rule to an ADR (against ADR 0014's local rule 2). Fixed in the fourth commit: the line now names rules about how to work or write, and asks for their source or reason to be recorded in a new ADR. It found the other files that cite CLAUDE.md still hold. The fourth commit, one sentence, was not reviewed again.

## #119 Move the writing rules back into CLAUDE.md (#118)

Merged 2026-11-16, branch `issue-118-writing-rules-home`.

The `reviewer` subagent reviewed the first commit (7e3a303). It checked every quote in ADR 0015 against its source (ADR 0014, `ca045fd^:CLAUDE.md`, #106, #117's SPEC.md, #118, Backstage's AGENTS.md and STYLE.md at e2a85555, Claude Code's memory page) and found each. Findings and what I did:

1. **Rules quoted in ADR 0014's table were live in no editable file** once CLAUDE.md stopped pointing at the ADR: the title "written as though it were an order", "Change your documentation in the same CL", "Default to delete". Real. **Fixed:** these are now in CLAUDE.md, with "Do not synthesize" and the Agent file row's rules, found by going through the table again. ADR 0015 lists them and says CLAUDE.md, the intros and the templates hold the live rule.
2. **ADR 0015 said "A pointer to a second file is the step that failed in #117"**, a cause the record doesn't show. Real: it broke the new "Don't widen it into a rule or a cause". **Fixed:** "Behind a pointer, #110 kept six lines of the rules, and the line #117 needed was not among them."
3. **Lines in #105 that still made ADR 0014 the rule book** (Method 6, three bullets under "For the agent picking up a step"). **Fixed** in the #105 edit.
4. **#111, #112 and #114 say the same.** Outside this issue: a comment on each.
5. **#118 is not a sub-issue of #105.** Left for the owner.

A second run of the `reviewer` covered all four commits then on the branch (to 6bbf07c), under its new instructions. Findings and what I did, in the fifth commit:

1. **A new local rule had no named home for its reason, and "The rule goes in this file" was wrong for a reviewer rule** (overcorrection, part confirmed). Real. **Fixed:** the reason goes in a new ADR, standard or local; only a wording fix needs none. The rule goes in CLAUDE.md or `.claude/agents/`.
2. **"For a why, link SPEC.md or the ADR" bound comments** (confirmed; six comments in `src/` hold a local why). **Fixed:** a comment keeps a why that belongs to its code alone.
3. **A checkable claim inside a reason lost its "(not checked)"** (unconfirmed; `docs/known-issues.md` has such marks). Real. **Fixed:** a claim a reader would have to look up is still a fact.
4. **ADR 0015 said every rule ADR 0014's table quotes was written out; two were not** ("concrete enough to verify", a hook for what must always happen). **Fixed:** both are in CLAUDE.md's last line, and ADR 0015's list is complete.
5. **ADR 0015 placed two earlier wordings in the ADR's drafts; they were in CLAUDE.md** (confirmed). **Fixed.** Also unconfirmed there: the ADR holds a second decision, the two reviewer rules. Left: the owner asked for them in this PR, and the ADR says so.
6. **Bold for UI labels applied to test names and comments** (unconfirmed). **Fixed:** docs, issues and PRs only.
7. **"No added emphasis" against the section's bold lead-ins** (unconfirmed). Checked: Claude Code's best practices page speaks of "adding emphasis to a `CLAUDE.md` line" and of "adding IMPORTANT". **Fixed:** the line now says no emphasis words such as "IMPORTANT". The lead-ins stay as labels.
8. **Three general rules sat in the per-text list** (unconfirmed, low). **Fixed:** two moved to the first list; the CLAUDE.md line is now labelled "This file".
9. **The diff stat in this body was stale** (confirmed). **Fixed.**
10. **#105's Method item 5 kept "every rule that applies to a sentence in any file"** (confirmed, low). **Fixed** in #105.

Sixth commit, after the owner read the fifth. Two of its fixes were changed:

- Finding 3's fix, and the rule it patched ("a reason takes no source and no '(not checked)'"), are replaced. The rule had swung from marking the owner's claim as unchecked to not checking it at all. Now the claim is checked when written: the Android line carries StatCounter's figure.
- Finding 6's fix kept bold for UI labels in docs, issues and PRs. Written alone, that reads as leave to name labels anywhere, which is #104's problem. Now the words on a button stay in the code.

A third run of the `reviewer` covered all six commits (to ae81160). Findings and what I did, in the seventh commit:

1. **The button-word rule's "only" left no home for wording that is a product choice** (overcorrection, confirmed; #104 gives it to SPEC.md, and a PR that renames a label must quote it). **Fixed.**
2. **"72% of phones" is not what StatCounter states**: its figure is a share of mobile web page views (confirmed). **Fixed:** "72% of mobile web use".
3. **"(not checked)" narrowed to "tried and couldn't"** would make existing marks in SPEC.md and docs/known-issues.md breaks (unconfirmed). Real. **Fixed:** the mark doesn't stand in for a check that could be made now; ADR 0015 says the existing marks stay until steps 3 to 7.
4. **"Not who made it" bound SPEC.md only** (unconfirmed; #99's first example is in docs/known-issues.md). Real. **Fixed:** "The owner chose it" is not a reason, in any text.
5. **This body said four local rules; there are five** (confirmed). **Fixed.**
6. **This section was stale** (confirmed). **Fixed.**
7. **Trial table row 4 keeps "it is how the first version worked" in a SPEC.md line**, which may be history (unconfirmed, low). Left: #106 gives those words as the answer to why, so they stand as the reason.

The seventh commit, which holds these fixes, was not reviewed again.

## #120 Write SPEC.md as OpenFastTrace items

Merged 2026-11-19, branch `issue-106-spec-format`.

The `reviewer` subagent reviewed the first commit (f075f24). It confirmed every citation, each built feature's checks against the tests, all 12 old device checks against #74 and the issues, the four reasons #106 asked to keep, and the outside quotes. What it found, and what I did:

1. **The install tip misquoted WebKit:** "a site's data" and "without a visit", where WebKit says script-writable storage and "without user interaction". Fixed: it now uses WebKit's words.
2. **PECR marked "(not checked)" when it could be checked.** Fixed: the rationale now quotes Schedule A1, paragraph 4, from legislation.gov.uk, and the line about the 403 is gone.
3. **The Copyright reason ("free to copy wherever it is opened") contradicted the US-and-UK check.** Fixed: "Everyone who opens the app gets a copy of what it ships." The rework (a2408e1) later made it "Everyone who opens the app, or the public repo, gets a copy."
4. **Overcorrection:** the reasons for the speed range and for the library filters were dropped. Fixed:
   - The common-range claim is false: Speeedy runs from 50 to 1,600. So the 100 floor now says no reason is recorded.
   - The filters' reason came back marked "(not checked)"; b9b327d later dropped the Play Books and Kindle claim, which had no link (second review, item 5).
5. **The device-check home was wrong:** #74 holds only built features' device checks. Fixed in SPEC.md and ADR 0016.
6. **Unconfirmed: a shrunk word may fall below WCAG's large-scale size.** Real. The line then said it was not checked. Later the owner chose to state only the 3:1 rule, so the line is gone.
7. **Rules narrowed or lost.** Fixed, all four:
   - A piece with no letters isn't shown on its own, and a symbol with no word before it joins the next word.
   - The word count is of the reading flow.
   - The rule for which locked files make a book copy-protected.
   - Edge on Android no longer reads as supported.
8. **Six reasons dropped by my trimming pass.** Overcorrection. Fixed: Title, Same text twice, Same book twice, Images, 13 letters, and the left-of-centre reason are back.
9. **Unconfirmed: two new reasons with no source.**
   - Tuning screen behind About: it now says no reason is recorded.
   - Copyright: see 3.
10. **UI labels:**
    - The filters were named by their labels. Now they're named by what they show.
    - The quoted labels are now in bold.
    - New mark is a glossary term.
11. **Lost links:** the patent link (Google Patents) and the Speeedy fixture permalink. Fixed: both are back. Whether the European family covers the UK now reads "unknown".
12. **ADR 0016 errors.** Fixed:
    - SPEC.md quotes nothing from OpenFastTrace, and the ADR now says so.
    - Rule 3's reason was wrong about OpenFastTrace's own file, and is rewritten.
    - ADR 0014's table row is now marked superseded too.
13. **ADR 0017 overstated speedread's base time.** Fixed: it now gives speedread's formula, and links Speeedy's `msPerWord` for its 60,000 ÷ wpm.
14. **The focus-letter link hid speedread's departure.** Fixed: the rationale says speedread counts punctuation, and why Readalez doesn't.
15. **Is −22% "much shorter"?** For the owner to judge. The numbers are above.

The second commit (dcc7aab), which holds these fixes, and the rework (a2408e1) were not reviewed again by the `reviewer` subagent. The rework's third pass compared it with the earlier version instead.

**Second review (whole branch, after the rework).** What it found, and what I did:

1. **Languages went back to a list of scripts,** against #106. Fixed: written by what the reader needs again, with `;` as a question mark only after a Greek word (`src/core/sentences.ts`).
2. **The en dash read as never pausing,** but a spaced en dash pauses (`src/core/sentences.ts`, `sentences.test.ts`). Fixed.
3. **The glossary's Part said every heading starts a chapter.** Fixed: a part is a stretch wholly in the reading flow or wholly skipped; how parts are cut stays in `src/core/epub/flow.ts`.
4. **The roadmap said the reader settings default to v1's behaviour,** while SPEC.md says to be determined. Fixed in `docs/roadmap.md`, and SPEC.md's line moved out of the Rationale.
5. **Play Books and Kindle claim without links.** Dropped.
6. **The 8 px figure lost "today's single word size".** Restored.
7. **#21 and #73 cited text that moved.** Both issue bodies fixed.
8. **Import no longer says what happens to settings on a device with its own.** Not changed: the owner dropped the rule because its meaning was unknown.
9. **ADR 0016 rule 6 contradicts SPEC.md's principle on departures.** Noted on #121, which decides ADR 0016.
10. **This body didn't match the branch.** Fixed.
11. **Five older outside facts are unlinked** (Safari Reader view, Gutenberg's wrapping, EPUB sources, font obfuscation, backgrounded apps closing). Carried from main; left for #113.

Unrelated: #18's end-to-end check says "only the three built-in books remain", and #73 says "the three shipped EPUBs total at most 400 KB"; there are 24.

**Third review (whole branch, at b9b327d).** Nothing blocking. What it found, and what I did:

1. **The roadmap's Reader layout options contradicted itself** and widened "to be determined" to every setting. Fixed: only where play resumes and where Back goes are to be determined; the others default to v1's behaviour. The Open line no longer assumes v1 defaults.
2. **Behaviour the rework dropped:** colophons in the paperwork list, and no offline band on later visits (`src/ui/useOfflineBooks.ts`). Both restored. "Replacing the built-in books" in Out of scope stays dropped, with the rest of the book selection.
3. **"The build checks each one's death year"** was wrong: `scripts/build-books.ts` does, run by `npm run books`. Fixed.
4. **#22 quoted the old "bullet" wording.** Issue body fixed.
5. **The 8 px figure lost where it was measured.** Restored: the container's Chromium, on Playwright screenshots; Android's own fonts not checked.
6. **The WebKit quote stopped before its point.** Extended to "We do not expect the first-party in such a web application to have its website data deleted."
7. **More unlinked outside facts carried from main.** Listed on #113 with the five above.

**Fourth review (whole branch, at 850c0d6).** Nothing blocking. Fixed in c861bc1 (item 5: SPEC.md now only links the roadmap, which holds the defaults; item 7: **Unknown author** is quoted once, **All**, **My books** and **New** are no longer quoted, "Chips" is gone):

1. **"Back" names two controls.** SPEC.md now calls the sentence moves Back and Forward, but on screen **Back** leaves the reader (`src/ui/Reader.tsx:147`), and the sentence buttons are "Previous sentence" and "Next sentence" (`Reader.tsx:188`, `:194`). From 80b730b.
2. **The Title reason, restored after round 1, was dropped again** by the rework (a2408e1). This body still says it is back.
3. **The roadmap's Open line lost "whether any default should change"** for the other reader settings. From 850c0d6.
4. **The caniuse note that the Home Screen wake-lock bug is still listed** was dropped, without a mention here. From f075f24.
5. **The reader settings' defaults have two homes:** SPEC.md and the roadmap each point at the other. From f4cb2ae and b9b327d.
6. **ADR 0016's comparison of BCP 14 and OpenSpec** doesn't match #106's own table (unconfirmed). From f075f24.
7. **UI labels quoted without a reason for the wording:** **Unknown author** twice, and **New**, **All**, **My books**; "Chips" is a term #117 merged into library filter. From a2408e1 and 80b730b.
8. **The blank-title rule reads as covering renames,** but a blank rename keeps the title. On main.
9. **This body drifted:** items above that later commits undid.

**The pattern across the four reviews.** Each round found problems the earlier rounds missed:

| Round | At | Findings | Introduced by the previous fix round or rework | Older, missed by earlier rounds |
| --- | --- | --- | --- | --- |
| 1 | f075f24 | 15 | (first rewrite) | n/a |
| 2 | f4cb2ae | 11 | 4 (a2408e1, f4cb2ae) | 7 |
| 3 | b9b327d | 7 | 3 (a2408e1, b9b327d) | 4 |
| 4 | 850c0d6 | 9 | 5 (a2408e1, 80b730b, f4cb2ae, b9b327d, 850c0d6) | 4 |

Causes, as the fourth review traced them with `git blame`:

- **Bulk rewrites after review.** The rework (a2408e1, three subagent passes) rewrote 197 of SPEC.md's 643 lines. Its own check compared it with the version just before it, not with main or the code, so it couldn't see what main had that the first rewrite already lost. It also reverted one round-1 fix.
- **Fix rounds add new text.** Each round's fixes are prose edits, and the next round finds new slips in them (the roadmap line, fixed and refixed in three commits).
- **Each review samples.** One reviewer reading 640 lines, two ADRs, 13 issues and the code checks a different subset each time. Colophons and "the build checks" came from f075f24 and were missed by rounds 1 and 2.
- **Briefs grew exemptions** each round (owner decisions, #113, #121), so each reviewer judged scope anew.
- **This body piles up "Fixed" claims** that later commits undid.

What the fourth review suggests would make one round enough: no bulk passes after the first review; an inventory mapping each rule, number and quote on main to its line at HEAD (or to where it went and why), checked row by row; one reviewer per few features plus one for terms and one for this body; and, for a change this size, smaller PRs.

**Split review (five reviewers in parallel, at c861bc1).** One reviewer per slice: features 1–4; features 5–7; features 8–14 and the closing sections; terms, glossary, ADRs and roadmap; this body and the issues. Nothing blocking. Fixed:

- **SPEC.md:** the **Public** label belongs to the built-in books' filter, not to each book. TXT import guesses chapters, not verse. The store-book DRM caveat ("not checked on real files") is back. "Copy from Safari's Reader view" is an instruction again, not a claim. Feature 11 says a PR that makes tuned values the defaults updates feature 6's table, as `src/core/timingValues.ts` cites. How features are checked says docs/reviews.md is there "to show what the reviews catch". The Languages reason rests on features 5 and 6, not on a claim about scripts. The settings line moved into the Resume item's description. The "etc." reason and "the largest text size is the largest at which…" are back. **Unknown author** is no longer quoted. A flash of a long word is now a **chunk** (glossary), since **part** means a stretch of the reading flow; the glossary's **Word** matches feature 5. "Texts", "backup" and "moves the word frame" now use the glossary's terms.
- **docs/roadmap.md:** the undecided defaults moved to **Open**; the library filters entry no longer names the chips.
- **ADR 0016:** an OpenFastTrace item is an ID and a description, with an optional title, as the guide says.
- **`vite.config.ts`:** its comment cites feature 12 for offline books, where the rule now is.
- **Issues:** #15, #18 and #21 no longer point at SPEC.md text that moved. #121 has a correction: ADR 0017 is a timing decision, not a documentation rule.
- **This body:** the ADR 0016 wording, the Copyright quote, the Play Books commit, the heading count and the Verified output.

Left: "Safari and the installed app keep separate libraries" has no link, and `src/core/longWords.ts` still calls chunks parts, and code and ARCHITECTURE.md still say "chip"; all three are on #113. #15 has been stale since #89 merged and may be simpler to close. "The later paragraph pacer can build on it" (paused view) stays dropped: it is a plan, not a reason.

**Second split review (five reviewers, at 763edc2).** 28 findings, none blocking: features 1–4, 1; features 5–7, 5; features 8–14 and the closing sections, 1; terms, ADRs and roadmap, 14; this body and the issues, 7. By the owner's rule (two split rounds, then stop), SPEC.md is not changed again in this PR. What is left is recorded as directions, not tasks:

- SPEC.md terms, glossary rows, dropped or circular reasons, and stale citations elsewhere: #114.
- Code and doc pointers to moved text (`e2e/importEpub.spec.ts`, `src/ui/App.tsx`, `docs/known-issues.md`, `README.md`): #113.
- ADR 0016 and 0017 details: #121.
- The pattern of the six review rounds: #122.

Fixed in issue text only: #122's claim that every PR gets one review (the log records second reviews on nine PRs), #105's step order, and three lines of this body.
