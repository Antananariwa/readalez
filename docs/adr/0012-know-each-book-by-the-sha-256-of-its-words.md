# 12. Know each book by the SHA-256 of its words

Date: 2026-11-06
Status: Accepted

## Context

- The backup file merges books into another device, and "Books match by text" there ([SPEC.md feature 9, Import](../../SPEC.md#import)). So a book needs an ID that is the same on every device that holds it.
- A book can be renamed ([SPEC.md feature 4](../../SPEC.md#4-library)), and the parsers' rules for paragraph kinds, such as verse, still miss cases ([known issue](../known-issues.md#unusual-namespace-prefixes-lose-verse-and-the-nav)).

Options considered:

- **A random ID** for each book when the app stores it.
- **A hash of the input:** the imported file or the pasted text.
- **A hash of the book's words.**

## Decision

- A book's ID is the SHA-256 of its words (`bookId` and `bookText` in `src/core/bookId.ts`). The app works it out once, when it stores the book, and stores it with the book.
- Titles and paragraph kinds stay out, so a rename, or a change in how the parser recognises verse or headings, doesn't make a different book.
- SHA-256 has 128 bits of collision resistance ([NIST, Hash functions](https://csrc.nist.gov/projects/hash-functions#security-strengths)).
- The other options lose:
  - A random ID would give one book two IDs on two devices.
  - A hash of the input would give the same text two IDs in two files, or pasted once and imported once.

## Consequences

- A book imported on two devices gets the same ID only if both parse it into the same words. A parser change between the two imports gives two books, and the backup file's merge (#21) inherits that.
- The app never works a stored book's ID out again, so a parser change doesn't change it.
