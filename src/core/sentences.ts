// Sentence ends and starts (SPEC.md feature 6): the sentence pause, and the
// sentence starts the reader moves between (SPEC.md feature 7).

import { wordText, type Word } from "./text.ts";

/** What a word's trailing punctuation asks for. */
export type Punctuation = "sentence" | "clause" | null;

/** Closing quotes (« » „ “ ‹ › included, in either direction) and `"` `'`. */
const QUOTE = /[\p{Pi}\p{Pf}"']$/u;
/** Closing brackets. */
const BRACKET = /\p{Pe}$/u;
/** Spaces (French puts one before `»`) and word joiners. */
const SPACE = /[\s\u2060]$/u;
const SENTENCE_END = /[.!?…‽]$/u;
/**
 * `,` `;` `:`, a dash (Gutenberg's `--` included) or a spaced en dash.
 * U+037E is the same mark as `;` once text is normalised.
 */
const CLAUSE_END = /(?:[,;:\u037E—―⸺⸻–]|--)$/u;
/** The Greek question mark: `;`, or U+037E, which looks the same. */
const GREEK_QUESTION = /[;\u037E]$/u;
/** The Greek ano teleia (a raised dot, like a semicolon). */
const GREEK_SEMICOLON = /[\u0387\u00B7]$/u;
const GREEK = /\p{Script=Greek}/u;

/**
 * Strips closing quotes, brackets and spaces from the end of a word, and
 * says whether a bracket was among them.
 */
function stripClosing(text: string): { core: string; bracket: boolean } {
  let core = text;
  let bracket = false;
  for (;;) {
    if (BRACKET.test(core)) bracket = true;
    else if (!QUOTE.test(core) && !SPACE.test(core)) break;
    core = core.slice(0, -1);
  }
  return { core, bracket };
}

/**
 * Sorts a word by its trailing punctuation, looking through closing quotes,
 * brackets and spaces (`end.”` and `« Entrez ! »` end a sentence). A closing
 * bracket on its own counts as a clause. A single hyphen isn't a dash.
 */
export function punctuation(text: string): Punctuation {
  const { core, bracket } = stripClosing(text);
  const greek = GREEK.test(core);
  if (SENTENCE_END.test(core)) return "sentence";
  if (greek && GREEK_QUESTION.test(core)) return "sentence";
  if (CLAUSE_END.test(core) || (greek && GREEK_SEMICOLON.test(core))) {
    return "clause";
  }
  return bracket ? "clause" : null;
}

/** How an abbreviation's dot is read at the end of a word. */
export type Abbreviation =
  /** Never a full stop mid-paragraph: titles and the like (`Mr.`, `z.`). */
  | "never"
  /** A full stop when the next word starts with a capital (`etc.`). */
  | "capital";

/**
 * Splits a list of abbreviations as usually written. A capital first letter
 * also matches, so `mr.` covers `Mr.`.
 */
function list(...groups: string[]): Set<string> {
  return new Set(groups.join(" ").split(" "));
}

/**
 * Titles, and abbreviations that almost never end a sentence: names,
 * numbers or more words follow them. French `MM.` is listed in capitals so
 * the interjection `Mm.` doesn't match.
 */
const NEVER_ENDS = list(
  // English
  "mr. mrs. ms. dr. st. sr. prof. rev. hon. gen. col. capt. lt. sgt. mt.",
  "messrs. vs. cf. viz. approx. p. pp. e.g. i.e.",
  // French
  "MM. mme. mlle. mgr. ste. ex. env.",
  // German (z. B., d. h.)
  "z. d. h. nr. vgl. bzw. ca. hr. hrn.",
  // Spanish (p. ej.)
  "sra. srta. sres. dra. ud. uds. vd. vds. dña. ej. pág. núm.",
  // Polish
  "np. tzn. tj. m.in. mgr. inż. ul. św. ks. płk.",
  // Russian (т. е.)
  "т. е. т.е. см. стр. ул. напр. проф. тов.",
  // Greek
  "κ. κα. δηλ. βλ. σελ. αρ. π.χ.",
);

/**
 * Abbreviations that often end a sentence, and common words that look like
 * one (`ok.`, Polish `im.` and Russian `им.`, "them").
 */
const MAY_END = list(
  // English
  "etc. jr. no. inc. ltd. co. ok.",
  // German
  "usw.",
  // Polish (after a year: w 1990 r.)
  "itd. itp. r. im.",
  // Russian (и т. д.; after a year: в 1812 г.)
  "д. г. им.",
);

/** One capital and a dot: an initial. `I.` is left out, as in "It was I." */
const INITIAL = /^\p{Lu}\.$/u;
/** Single letters with dots: `U.S.`, `a.m.`. */
const DOTTED = /^(?:\p{L}\.){2,}$/u;
/** Starts with a capital letter, after any opening quotes or brackets. */
const CAPITAL = /^[^\p{L}\p{N}]*\p{Lu}/u;

/**
 * How a word ending in an abbreviation's dot is read, looking through
 * brackets and quotes around it (`(U.S.)`), or null for any other word.
 * Initials never end a sentence mid-paragraph, since a name follows them.
 * Decimals (`3.14`) don't end in a dot and need no rule.
 */
export function abbreviation(text: string): Abbreviation | null {
  const core = stripClosing(text).core.replace(/^[^\p{L}\p{N}]+/u, "");
  if (!core.endsWith(".") || core.endsWith("..")) return null;
  const lower = core.charAt(0).toLowerCase() + core.slice(1);
  const listed = (set: Set<string>) => set.has(core) || set.has(lower);
  if (listed(NEVER_ENDS)) return "never";
  // Before the next list, so the initial `R.` isn't read as Polish `r.`.
  if (INITIAL.test(core)) return core === "I." ? null : "never";
  if (listed(MAY_END)) return "capital";
  if (DOTTED.test(core)) return "capital";
  return null;
}

/**
 * True when a sentence ends with this word: at the end of a paragraph or a
 * heading, or at `.` `!` `?` `…` (and Greek `;`). An abbreviation's dot ends
 * one only when the abbreviation may end a sentence and the next word starts
 * with a capital. A split word's parts before the last never end one.
 */
export function endsSentence(word: Word, next: Word | undefined): boolean {
  if (word.end === "paragraph" || word.end === "heading") return true;
  if (word.continues) return false;
  const text = wordText(word);
  if (punctuation(text) !== "sentence") return false;
  switch (abbreviation(text)) {
    case "never":
      return false;
    case "capital":
      return next !== undefined && CAPITAL.test(wordText(next));
    default:
      return true;
  }
}

/** The index of each sentence's first word, in order. */
export function sentenceStarts(words: readonly Word[]): number[] {
  const starts: number[] = words.length > 0 ? [0] : [];
  words.forEach((word, i) => {
    if (i + 1 < words.length && endsSentence(word, words[i + 1])) {
      starts.push(i + 1);
    }
  });
  return starts;
}

/** The position in `starts` of the sentence holding word `index`. */
function sentenceAt(starts: readonly number[], index: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((starts[mid] ?? 0) <= index) low = mid;
    else high = mid - 1;
  }
  return low;
}

/** The first word of the sentence holding word `index`. */
export function sentenceStart(
  starts: readonly number[],
  index: number,
): number {
  return starts[sentenceAt(starts, index)] ?? 0;
}

/**
 * The last sentence start before word `index`, if any, where Back goes: the
 * start of the sentence holding it, or of the sentence before when `index`
 * is a sentence's first word.
 */
export function sentenceStartBefore(
  starts: readonly number[],
  index: number,
): number | null {
  return index > 0 ? (starts[sentenceAt(starts, index - 1)] ?? null) : null;
}

/** The first word of the sentence after the one holding `index`, if any. */
export function nextSentenceStart(
  starts: readonly number[],
  index: number,
): number | null {
  return starts[sentenceAt(starts, index) + 1] ?? null;
}

/**
 * The sentence start nearest to word `index`, counted in words, where the
 * progress bar lets go (SPEC.md feature 7). A tie goes to the earlier start,
 * so the sentence the word is in wins.
 */
export function nearestSentenceStart(
  starts: readonly number[],
  index: number,
): number {
  const at = sentenceAt(starts, index);
  const before = starts[at] ?? 0;
  const after = starts[at + 1];
  return after !== undefined && after - index < index - before ? after : before;
}
