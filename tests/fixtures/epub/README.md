# EPUB fixtures

Books for the EPUB import tests (`tests/epub/fixtures.test.ts`, `e2e/importEpub.spec.ts`; ADR 0009). #15 and #16 reuse them. Each is by authors, translators and illustrators who died over 100 years ago (SPEC.md, Legal and licensing), and each is kept small.

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
