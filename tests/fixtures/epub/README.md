# EPUB fixtures

Books for the EPUB import tests (`tests/epub/fixtures.test.ts`, `e2e/importEpub.spec.ts`; ADR 0009). #15 and #16 reuse them. SPEC.md (Legal and licensing) asks that each be by authors, translators and illustrators who died over 100 years ago; whether _Pride and Prejudice_'s preface and _Sherlock Holmes_ meet that is still to be checked (#14). Each is kept small.

## Project Gutenberg's books

Downloaded from Project Gutenberg by the owner and added to the #14 branch on 2026-11-08 (commits `d7ff995` and `5efdc13`), then renamed. Each carries Gutenberg's license pages, which Gutenberg requires of a text that keeps its name (SPEC.md, Legal and licensing). Each starts its spine with a page holding only the cover image, which reads as an empty section. The front matter (Gutenberg's header, the title page and the contents) comes before the author's text; #15 finds where that text starts.

| File                                            | Book                                                                                                      | Gutenberg                                                                  | Format                                                  | Size (bytes) | SHA-256                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `gutenberg-11-alice-in-wonderland-epub3.epub`   | _Alice's Adventures in Wonderland_, Lewis Carroll                                                         | [#11](https://www.gutenberg.org/ebooks/11), updated June 26, 2025          | EPUB 3                                                  | 189,249      | `4f81245d31380ac1d6eafb9a321e3691369bc70985736ae4bccf849a4f784036` |
| `gutenberg-1342-pride-and-prejudice-epub2.epub` | _Pride and Prejudice_, Jane Austen, with a preface by George Saintsbury and illustrations by Hugh Thomson | [#1342](https://www.gutenberg.org/ebooks/1342), updated September 29, 2026 | EPUB 2 (package version 2.0), without the illustrations | 609,138      | `2172db6a64d45b02f239cc7b46b50d7117fcd527e2a7a1386694f5eeccd26381` |
| `gutenberg-1513-romeo-and-juliet-epub3.epub`    | _Romeo and Juliet_, William Shakespeare                                                                   | [#1513](https://www.gutenberg.org/ebooks/1513), updated September 18, 2025 | EPUB 3                                                  | 341,144      | `0dea6a849392a1e669f368f7ab7bd746fc4473418453fb956343ae297acf4412` |
| `gutenberg-1661-sherlock-holmes-epub3.epub`     | _The Adventures of Sherlock Holmes_, Arthur Conan Doyle                                                   | [#1661](https://www.gutenberg.org/ebooks/1661), updated October 10, 2023   | EPUB 3                                                  | 379,503      | `310ddf29f2b98b870b0e970061d236c9ce7c65163e0e172c254a1db3d070d3f4` |
| `gutenberg-2701-moby-dick-epub3.epub`           | _Moby Dick; Or, The Whale_, Herman Melville                                                               | [#2701](https://www.gutenberg.org/ebooks/2701), updated October 11, 2026   | EPUB 3                                                  | 699,614      | `e247676589c02a65bc80ff7bf7aaaf146d7c69eadfcfb96633c5f606a08602db` |

The "updated" dates are as each book's Gutenberg header states them. Each EPUB 3 file also has an NCX, which the importer doesn't read when a nav is present, so _Pride and Prejudice_ is the one fixture whose chapters come from an NCX. Every file keeps only its cover image.

What each has, as the tests in `tests/epub/fixtures.test.ts` show:

- **_Alice_:** verse as `<p class="poem">`, with `<br/>` between lines and an empty line between stanzas. This edition has no opening poem.
- **_Pride and Prejudice_:** a long preface before the novel; illustration blocks and captions with the classes `figcenter` (37), `figleft` (1) and `caption` (67), with no `<figure>`; and NCX labels that include the captions of illustrations this edition leaves out (#80).
- **_Romeo and Juliet_:** a play: acts with nested scenes in the nav, and each speech with its speaker's name as its first line (#79).
- **_Sherlock Holmes_:** twelve stories, some with numbered parts nested in the nav.
- **_Moby Dick_:** the Etymology and Extracts before chapter 1, and 135 chapters in 11 spine items.

None has links to notes, found by searching the XHTML for links to ids starting with `fn`, `footnote` or `note`. #15 needs a book with notes.

## `standard-ebooks-a-christmas-carol.epub`

_A Christmas Carol_ by Charles Dickens (died 1870), EPUB 3. Standard Ebooks dedicate their own work to the public domain (CC0), as the book's `epub/text/uncopyright.xhtml` says.

- **Source:** the `src/` folder of [`standardebooks/charles-dickens_a-christmas-carol`](https://github.com/standardebooks/charles-dickens_a-christmas-carol/tree/fbcca8acb37169bbb560b8796c1f05b0240f6792/src) at commit `fbcca8a`, fetched on 2026-11-07.
- **Left out:** `src/epub/images/`, to keep the file small (`cover.svg` alone is 1,111,104 bytes). The package still lists the images, and the importer never opens them.
- **What it has:** a preface, a song in Stave I marked `z3998:song`, word joiners around em dashes, no-break spaces, and `<img>` with alt text on the imprint page. It has no soft hyphens.
- **Size:** 80,469 bytes. SHA-256 `52ba48e6a3b2c4570c8ffe613e7fb70f2e900e7d890905aa46eedcca0157668e`.
- **Built with** this Python script, run as `python3 -I zip_epub.py <src folder> <out.epub>`. It writes `mimetype` first and stored, as EPUB's container format requires ([EPUB 3.3](https://github.com/w3c/epub-specs/blob/8f568a4d1913d6c2c30afa3329b99b02bad84ae7/epub33/core/index.html), `sec-zip-container-mime`), deflates the rest, and fixes the timestamps so the bytes are the same on every run:

```python
import os, sys, zipfile

src, out = sys.argv[1], sys.argv[2]
names = sorted(
    os.path.relpath(os.path.join(root, f), src).replace(os.sep, "/")
    for root, _, files in os.walk(src)
    for f in files
)
names.remove("mimetype")

def entry(name, method):
    info = zipfile.ZipInfo(name, date_time=(2026, 11, 7, 0, 0, 0))
    info.compress_type = method
    info.external_attr = 0o644 << 16
    return info

with zipfile.ZipFile(out, "w") as z:
    with open(os.path.join(src, "mimetype"), "rb") as f:
        z.writestr(entry("mimetype", zipfile.ZIP_STORED), f.read())
    for name in names:
        with open(os.path.join(src, name), "rb") as f:
            z.writestr(entry(name, zipfile.ZIP_DEFLATED), f.read(), compresslevel=9)
```
