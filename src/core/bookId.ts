// Book IDs (issue #12, ADR 0007): a book is known by its text, so the same
// text gets the same ID on every device. Later features match books by it: an
// EPUB imported twice (#16) and backups across devices (#21). The ID is
// computed once, when the book is added, and stored with it, so later changes
// to parsing don't change it.

import type { Section } from "./text.ts";

/** The SHA-256 of the book's text (`bookText`), as 64 hex digits. */
export function bookId(sections: readonly Section[]): string {
  return sha256Hex(bookText(sections));
}

/**
 * The words a book ID is taken from: every paragraph's text, a verse
 * paragraph's lines joined by line breaks, with a blank line between
 * paragraphs and between sections. Titles and paragraph kinds stay out, so the
 * ID depends on the words only.
 */
export function bookText(sections: readonly Section[]): string {
  return sections
    .flatMap((section) => section.paragraphs)
    .map((paragraph) =>
      paragraph.kind === "verse" ? paragraph.lines.join("\n") : paragraph.text,
    )
    .join("\n\n");
}

/**
 * SHA-256 (FIPS 180-4) of `text` encoded as UTF-8, as lowercase hex. Written
 * here because `src/core/` can't use the browser's `crypto.subtle` or
 * `TextEncoder` (ADR 0003), and so it stays synchronous.
 */
export function sha256Hex(text: string): string {
  const message = utf8(text);
  // The message, a 1 bit, zeros, and the length in bits as 64 bits, padded to
  // a multiple of 64 bytes.
  const length = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(length);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = message.length * 8;
  view.setUint32(length - 8, Math.floor(bits / 2 ** 32));
  view.setUint32(length - 4, bits >>> 0);

  const hash = Uint32Array.from(INITIAL_HASH);
  const w = new Uint32Array(64);
  for (let block = 0; block < length; block += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(block + t * 4);
    for (let t = 16; t < 64; t++) {
      const w15 = w[t - 15]!;
      const w2 = w[t - 2]!;
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[t] = w[t - 16]! + s0 + w[t - 7]! + s1;
    }
    let a = hash[0]!;
    let b = hash[1]!;
    let c = hash[2]!;
    let d = hash[3]!;
    let e = hash[4]!;
    let f = hash[5]!;
    let g = hash[6]!;
    let h = hash[7]!;
    for (let t = 0; t < 64; t++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = (e & f) ^ (~e & g);
      const t1 = (h + s1 + choice + ROUND_CONSTANTS[t]! + w[t]!) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    // Uint32Array keeps each sum modulo 2^32.
    [a, b, c, d, e, f, g, h].forEach((value, i) => {
      hash[i] = hash[i]! + value;
    });
  }
  return Array.from(hash, (word) => word.toString(16).padStart(8, "0")).join(
    "",
  );
}

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * `text` as UTF-8 bytes. A lone surrogate becomes U+FFFD, as `TextEncoder`
 * does.
 */
export function utf8(text: string): Uint8Array<ArrayBuffer> {
  const bytes: number[] = [];
  for (const char of text) {
    let code = char.codePointAt(0)!;
    if (code >= 0xd800 && code <= 0xdfff) code = 0xfffd;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

/** FIPS 180-4, section 5.3.3. */
const INITIAL_HASH = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

/** FIPS 180-4, section 4.2.2. */
const ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
