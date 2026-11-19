# 17. Start timing at these values

Date: 2026-11-17
Status: Accepted

## Context

How long each word shows (SPEC.md feature 6) needs values before anyone can tune them by feel on a device with the tuning screen (feature 11). Until #106, SPEC.md held these values together with the readers it compared them to and the device trial that changed them. ADR 0016 moves the comparison and its history here, since this decision needs its alternatives.

The open-source Spritz-style readers that were read:

- [speedread](https://github.com/pasky/speedread) shows a word for 0.9 × 60 ÷ wpm seconds, plus 0.04 × √length of the same unit. At a comma the 0.9 becomes 2, and at a full stop 3 ([`$wordtime` to `$fstoptime`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L51-L54), [`word_time`](https://github.com/pasky/speedread/blob/375214f3dcff0082770f26b3e503ac299a41c6d4/speedread#L129-L138)).
- [Speeedy](https://github.com/sami-29/speeedy) shows a word for 2× at a sentence end and 1.4× at a comma. Its sentence-pause setting scales both, and a paragraph pause comes on top ([`getPauseMultiplier`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L615-L643), [where it's scaled](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L420-L427)).
- Speeedy ([`msPerWord`](https://github.com/sami-29/speeedy/blob/028caa2d41eebb8c54309e4eebfb06f253ccc9f9/src/services/rsvp-engine.ts#L417)) and Readalez show an ordinary word for 60,000 ÷ wpm milliseconds, with pauses on top. speedread's ordinary word comes close to that.

The first values, tried on the iPhone in #36, were 3× at a sentence end, 4× at a paragraph end, and 3× for the first word after play:

- A sentence end felt like a stop at every sentence.
- A paragraph end felt no different from a sentence end.
- The start looked broken, since the word is already on screen while paused.

## Decision

Start from the values nearest to Speeedy's, as SPEC.md feature 6's table gives them:

- 1.5× at a comma, semicolon, colon, dash or closing bracket.
- 2× at a sentence end and at the end of a verse line.
- 5× at a paragraph end or a heading.
- At least 1.5× for the first word after play or a jump.
- 1.3× for a word of 8 letters or more, multiplied with the punctuation pause.

Sentence ends come down from #36's 3×, so that a sentence end no longer feels like a stop. Paragraph ends go up, to leave a clear break to blink. The start pause is shorter, since the word is already showing.

## Consequences

- The tuning screen (feature 11) changes these values on one device. A PR that makes new values the defaults updates SPEC.md feature 6's table and the test that pins it (`src/core/timingValues.test.ts`).
- These are starting values. SPEC.md's Open questions keeps the final values open until they are tuned.
