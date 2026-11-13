// Builds the built-in books (SPEC.md feature 3, ADR 0013): each one's EPUB in
// public/books, from the `src/` folder of a pinned commit of its Standard
// Ebooks repository on GitHub, without its pictures, and the catalog the
// library lists them from, src/core/builtInBooks.ts. Run `npm run books`
// after changing BOOKS, and after a change to splitting or timing makes
// tests/builtInBooks.test.ts fail.
//
// The files are zipped in sorted order with fixed dates, so a rebuild gives
// the same bytes as long as Node's zlib deflates the same way.

import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import { format, resolveConfig } from "prettier";
import { zipArchive } from "../src/core/epub/testZip.ts";
import type { BuiltInBook } from "../src/core/library.ts";
import { describeBook } from "./builtInBook.ts";

/** A person whose death year decides the book's copyright. */
interface Person {
  name: string;
  died: number;
  /** Where the death year was read. */
  source: string;
}

/** A built-in book: where it comes from and whose rights it depends on. */
interface Source {
  /** The repository in github.com/standardebooks. */
  repo: string;
  commit: string;
  /** Its authors and translators. */
  people: Person[];
}

/**
 * Every author and translator died before this year, so the book is public
 * domain in the UK, where copyright lasts until the end of the 70th year
 * after the death (SPEC.md, Legal and licensing). Standard Ebooks checks US
 * copyright only.
 */
const DIED_BEFORE = 1956;

/**
 * The books, shortest first. Commits are each repository's latest on
 * 2026-11-12. Death years are Wikidata's date of death (P570), read through
 * its API on 2026-11-12.
 */
const BOOKS: Source[] = [
  {
    repo: "robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde",
    commit: "bb6ccb4d19e94d71588dbacbd3a48aa6cd1846ed",
    people: [person("Robert Louis Stevenson", 1894, "Q1512")],
  },
  {
    repo: "lewis-carroll_alices-adventures-in-wonderland_john-tenniel",
    commit: "60e942b4f9dba672841470e9b6ec63956bfb8e7d",
    // John Tenniel's illustrations are left out with the pictures.
    people: [person("Lewis Carroll", 1898, "Q38082")],
  },
  {
    repo: "charles-dickens_a-christmas-carol",
    commit: "fbcca8acb37169bbb560b8796c1f05b0240f6792",
    people: [person("Charles Dickens", 1870, "Q5686")],
  },
  {
    repo: "jack-london_the-call-of-the-wild",
    commit: "2409a3bd1dfb16ba32e14d8a96894dd37aa4394e",
    people: [person("Jack London", 1916, "Q45765")],
  },
  {
    repo: "h-g-wells_the-time-machine",
    commit: "9fd22d612e6ed35cd07a8ed5e3ccdc4856c05088",
    people: [person("H. G. Wells", 1946, "Q42511")],
  },
  {
    repo: "l-frank-baum_the-wonderful-wizard-of-oz",
    commit: "ec37bfee7c2840e7a7ed305f5cda0e42f3fafca7",
    people: [person("L. Frank Baum", 1919, "Q207544")],
  },
  {
    repo: "henry-james_the-turn-of-the-screw",
    commit: "d1a51c0471556a3194d703aa269ef89c91425640",
    people: [person("Henry James", 1916, "Q170509")],
  },
  {
    repo: "marcus-aurelius_meditations_george-long",
    commit: "2bfcc917b83a4fff275d304930df99aee87bfde2",
    people: [
      person("Marcus Aurelius", 180, "Q1430"),
      person("George Long", 1879, "Q1507776"),
    ],
  },
  {
    repo: "f-scott-fitzgerald_the-great-gatsby",
    commit: "fe47c8c04f5175d45f9410f4e3ca64c257ae0acc",
    people: [person("F. Scott Fitzgerald", 1940, "Q93354")],
  },
  {
    repo: "rudyard-kipling_the-jungle-book",
    commit: "79a438b516d5d4c7b77cb5f57e883fb5e1872900",
    people: [person("Rudyard Kipling", 1936, "Q34743")],
  },
  {
    repo: "arthur-conan-doyle_the-hound-of-the-baskervilles",
    commit: "0097160e42afc58fa86337b8496de440267cf831",
    people: [person("Arthur Conan Doyle", 1930, "Q35610")],
  },
  {
    repo: "anna-sewell_black-beauty",
    commit: "f7941a0d25fc376985e595cdf58a5ecd95d82b4c",
    people: [person("Anna Sewell", 1878, "Q258741")],
  },
  {
    repo: "h-g-wells_the-war-of-the-worlds",
    commit: "7c2c332ce1ce8025d07ec982b02dad293dc63671",
    people: [person("H. G. Wells", 1946, "Q42511")],
  },
  {
    repo: "jules-verne_around-the-world-in-eighty-days_george-makepeace-towle",
    commit: "56c82e97ff5d4f8950afca05b71af72688a8da34",
    people: [
      person("Jules Verne", 1905, "Q33977"),
      person("George Makepeace Towle", 1893, "Q5542067"),
    ],
  },
  {
    repo: "jerome-k-jerome_three-men-in-a-boat",
    commit: "109d7ab7bd5c2ffbfe825f3883a2637a0419de83",
    people: [person("Jerome K. Jerome", 1927, "Q218698")],
  },
  {
    repo: "robert-louis-stevenson_treasure-island",
    commit: "86380ddddb73e7b22a41405cf8b70e72bcaf2d30",
    people: [person("Robert Louis Stevenson", 1894, "Q1512")],
  },
  {
    repo: "mary-shelley_frankenstein",
    commit: "3909a2b9d956377e797e235562cd237d3667fa9b",
    people: [person("Mary Shelley", 1851, "Q47152")],
  },
  {
    repo: "oscar-wilde_the-picture-of-dorian-gray",
    commit: "c6b6877688d7652e74c3db4e21322adcb27cadcd",
    people: [person("Oscar Wilde", 1900, "Q30875")],
  },
  {
    repo: "frances-hodgson-burnett_the-secret-garden",
    commit: "17f754b0b3637bf63c8d13ebb4f0b4f3d19eb2e1",
    people: [person("Frances Hodgson Burnett", 1924, "Q276028")],
  },
  {
    repo: "baroness-orczy_the-scarlet-pimpernel",
    commit: "a203dd3d87eae14d63b68e30ad3a5857f1692690",
    people: [person("Baroness Orczy", 1947, "Q234530")],
  },
  {
    repo: "l-m-montgomery_anne-of-green-gables",
    commit: "e1a1d123d83cc3eb9f4ade7cdd4315814b3cdc5c",
    people: [person("L. M. Montgomery", 1942, "Q273034")],
  },
  {
    repo: "henry-david-thoreau_walden",
    commit: "0cb96af03d98c3051d73966ff6e24f82d39e836d",
    people: [person("Henry David Thoreau", 1862, "Q131149")],
  },
  {
    repo: "jane-austen_pride-and-prejudice",
    commit: "ed94a32be3e875c0814568050c7544e03aad3ef5",
    people: [person("Jane Austen", 1817, "Q36322")],
  },
  {
    repo: "bram-stoker_dracula",
    commit: "e9968b274918e5a79b8e34cc93e50492363d1612",
    people: [person("Bram Stoker", 1912, "Q36184")],
  },
];

function person(name: string, died: number, wikidata: string): Person {
  return { name, died, source: `https://www.wikidata.org/wiki/${wikidata}` };
}

const root = new URL("../", import.meta.url);
const booksDir = new URL("public/books/", root);
const catalogFile = new URL("src/core/builtInBooks.ts", root);

for (const { repo, people } of BOOKS) {
  for (const { name, died } of people) {
    if (died >= DIED_BEFORE) {
      throw new Error(`${repo}: ${name} died in ${died}`);
    }
  }
}

await mkdir(booksDir, { recursive: true });
const catalog: BuiltInBook[] = [];
let total = 0;
for (const { repo, commit } of BOOKS) {
  const bytes = await buildEpub(repo, commit);
  await writeFile(new URL(`${repo}.epub`, booksDir), bytes);
  catalog.push(await describeBook(repo, bytes));
  total += bytes.length;
  console.log(`${repo}.epub: ${bytes.length.toLocaleString("en")} bytes`);
}
console.log(`Total: ${total.toLocaleString("en")} bytes`);

// Files of books no longer listed.
const wanted = new Set(BOOKS.map(({ repo }) => `${repo}.epub`));
for (const file of await readdir(booksDir)) {
  if (!wanted.has(file)) await rm(new URL(file, booksDir));
}

const catalogPath = fileURLToPath(catalogFile);
const source = `// Generated by \`npm run books\` (scripts/build-books.ts) from the EPUBs in
// public/books. Don't edit it by hand.

import type { BuiltInBook } from "./library.ts";

export const BUILT_IN_BOOKS: readonly BuiltInBook[] = ${JSON.stringify(catalog)};
`;
await writeFile(
  catalogFile,
  await format(source, {
    ...(await resolveConfig(catalogPath)),
    filepath: catalogPath,
  }),
);

/**
 * The EPUB of `repo` at `commit`: its `src/` folder without
 * `epub/images/`. The download is untrusted, so it's unpacked in a new
 * temporary folder and only read.
 */
async function buildEpub(
  repo: string,
  commit: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const dir = await mkdtemp(join(tmpdir(), "readalez-book-"));
  try {
    const unpacked = await download(repo, commit, dir);
    const src = join(unpacked, `${repo}-${commit}`, "src");
    const paths = (await readdir(src, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) =>
        relative(src, join(entry.parentPath, entry.name)).split(sep).join("/"),
      )
      .filter((path) => !path.startsWith("epub/images/"))
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (!paths.includes("mimetype")) throw new Error(`${repo}: no mimetype`);
    const files: Record<string, Uint8Array<ArrayBuffer>> = {};
    for (const path of ["mimetype", ...paths.filter((p) => p !== "mimetype")]) {
      files[path] = new Uint8Array(await readFile(join(src, path)));
    }
    return zipArchive(files, (data) => deflateRawSync(data, { level: 9 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Downloads and unpacks `repo` at `commit` into a new folder in `dir`,
 * trying again when the download breaks off: one rebuild got a cut-off
 * archive that `tar` couldn't read (2026-11-12).
 */
async function download(
  repo: string,
  commit: string,
  dir: string,
): Promise<string> {
  const url = `https://codeload.github.com/standardebooks/${repo}/tar.gz/${commit}`;
  for (let attempt = 1; ; attempt++) {
    const unpacked = await mkdtemp(join(dir, "source-"));
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      const archive = join(dir, "source.tar.gz");
      await writeFile(archive, new Uint8Array(await response.arrayBuffer()));
      execFileSync("tar", ["-xzf", archive, "-C", unpacked], {
        stdio: "pipe",
      });
      return unpacked;
    } catch (error) {
      if (attempt === 3) throw error;
      console.log(`${repo}: download failed, trying again`);
    }
  }
}
