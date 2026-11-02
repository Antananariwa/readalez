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

/**
 * Abbreviations that rarely end a sentence, as usually written; a capital
 * first letter also matches. Ones that often end a sentence are left out, so
 * they keep the sentence pause, since a listed one never ends a sentence
 * mid-paragraph: `etc.`, `usw.`, `itd.`, Polish `r.` and Russian `г.` after a
 * year, and common words such as `ok.`, Polish `im.` and Russian `им.`
 * ("them"). French `MM.` is listed in capitals so the interjection `Mm.`
 * doesn't match.
 */
const ABBREVIATIONS = new Set(
  [
    // English
    "mr. mrs. ms. dr. st. jr. sr. prof. rev. hon. gen. col. capt. lt. sgt.",
    "mt. messrs. vs. cf. viz. approx. p. pp.",
    // French
    "MM. mme. mlle. mgr. ste. ex. env.",
    // German (z. B., d. h.)
    "z. d. h. nr. vgl. bzw. ca. hr. hrn.",
    // Spanish (p. ej.)
    "sra. srta. sres. dra. ud. uds. vd. vds. dña. ej. pág. núm.",
    // Polish
    "np. tzn. tj. m.in. mgr. inż. ul. św. ks. płk.",
    // Russian (т. е.)
    "т. е. см. стр. ул. напр. проф. тов.",
    // Greek
    "κ. κα. δηλ. βλ. σελ. αρ.",
  ]
    .join(" ")
    .split(" "),
);

/** One capital and a dot: an initial. `I.` is left out, as in "It was I." */
const INITIAL = /^\p{Lu}\.$/u;
/** Single letters with dots: `e.g.`, `i.e.`, `U.S.`, `т.е.`, `π.χ.`. */
const DOTTED = /^(?:\p{L}\.){2,}$/u;

/**
 * True for an abbreviation or initial that ends in a dot, so its dot isn't a
 * full stop, looking through brackets and quotes around it (`(U.S.)`).
 * Decimals (`3.14`) don't end in a dot and need no rule.
 */
export function isAbbreviation(text: string): boolean {
  const core = stripClosing(text).core.replace(/^[^\p{L}\p{N}]+/u, "");
  if (!core.endsWith(".") || core.endsWith("..")) return false;
  if (DOTTED.test(core)) return true;
  if (INITIAL.test(core)) return core !== "I.";
  const lower = core.charAt(0).toLowerCase() + core.slice(1);
  return ABBREVIATIONS.has(core) || ABBREVIATIONS.has(lower);
}

/**
 * True when a sentence ends with this word: at the end of a paragraph or a
 * heading, or at `.` `!` `?` `…` (and Greek `;`) that isn't an abbreviation's
 * dot. A split word's parts before the last never end one.
 */
export function endsSentence(word: Word): boolean {
  if (word.end === "paragraph" || word.end === "heading") return true;
  if (word.continues) return false;
  const text = wordText(word);
  return punctuation(text) === "sentence" && !isAbbreviation(text);
}

/** The index of each sentence's first word, in order. */
export function sentenceStarts(words: readonly Word[]): number[] {
  const starts: number[] = words.length > 0 ? [0] : [];
  words.forEach((word, i) => {
    if (i + 1 < words.length && endsSentence(word)) starts.push(i + 1);
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

/** The first word of the sentence before the one holding `index`, if any. */
export function previousSentenceStart(
  starts: readonly number[],
  index: number,
): number | null {
  return starts[sentenceAt(starts, index) - 1] ?? null;
}

/** The first word of the sentence after the one holding `index`, if any. */
export function nextSentenceStart(
  starts: readonly number[],
  index: number,
): number | null {
  return starts[sentenceAt(starts, index) + 1] ?? null;
}
