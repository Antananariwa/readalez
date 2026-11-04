// "Story of the Door" (see storyOfTheDoor.ts: Stevenson, public domain) in
// the plain-text layout SPEC.md feature 1 describes for Gutenberg: a header,
// the `*** START OF` line, paragraphs hard-wrapped at 70 characters with
// blank lines between them, the `*** END OF` line and a footer. The header
// and footer lines are written for this fixture, not copied from Gutenberg.

import { storyOfTheDoor } from "./storyOfTheDoor.ts";

/** The chapter's paragraphs as single lines, the heading first. */
export const chapterParagraphs: string[] = storyOfTheDoor.paragraphs.map((p) =>
  p.kind === "verse" ? p.lines.join(" ") : p.text,
);

/** Breaks `text` into lines of at most `width` characters, at spaces. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line !== "" && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line === "" ? word : `${line} ${word}`;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

export const gutenbergHeader = [
  "The Project Gutenberg eBook of The Strange Case of Dr. Jekyll and Mr. Hyde",
  "",
  "Title: The Strange Case of Dr. Jekyll and Mr. Hyde",
  "",
  "Author: Robert Louis Stevenson",
  "",
  "*** START OF THE PROJECT GUTENBERG EBOOK THE STRANGE CASE OF DR. JEKYLL AND MR. HYDE ***",
].join("\n");

export const gutenbergFooter = [
  "*** END OF THE PROJECT GUTENBERG EBOOK THE STRANGE CASE OF DR. JEKYLL AND MR. HYDE ***",
  "",
  "Updated editions will replace the previous one.",
].join("\n");

/** The chapter hard-wrapped at 70 characters, without header or footer. */
export const hardWrappedChapter = chapterParagraphs
  .map((paragraph) => wrap(paragraph, 70).join("\n"))
  .join("\n\n");

/** The whole file: header, chapter and footer. */
export const gutenbergChapter = [
  gutenbergHeader,
  "",
  "",
  hardWrappedChapter,
  "",
  "",
  gutenbergFooter,
  "",
].join("\n");
