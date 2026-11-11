import { describe, expect, it } from "vitest";
import { utf8 } from "../bookId.ts";
import { storedZip } from "./testZip.ts";
import { crc32, openZip, ZipError } from "./zip.ts";

const TEXT = "Marley was dead, to begin with. Marley was dead.";

/** `TEXT` deflated, made with Node's `zlib.deflateRawSync`. */
const DEFLATED = Uint8Array.from([
  243, 77, 44, 202, 73, 173, 84, 40, 79, 44, 86, 72, 73, 77, 76, 209, 81, 40,
  201, 87, 72, 74, 77, 207, 204, 83, 40, 207, 44, 201, 208, 83, 240, 69, 149,
  215, 3, 0,
]);

/**
 * A one-file archive whose entry is `data`, deflated, with the CRC-32 and
 * size of `inflated`.
 */
function deflatedZip(
  data: Uint8Array<ArrayBuffer>,
  inflated = utf8(TEXT),
): Uint8Array<ArrayBuffer> {
  const name = "a.txt";
  const bytes = storedZip({ [name]: data });
  const view = new DataView(bytes.buffer);
  const directory = 30 + name.length + data.length;
  for (const [method, crc, size] of [
    [8, 14, 22],
    [directory + 10, directory + 16, directory + 24],
  ] as const) {
    view.setUint16(method, 8, true);
    view.setUint32(crc, crc32(inflated), true);
    view.setUint32(size, inflated.length, true);
  }
  return bytes;
}

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe("openZip", () => {
  it("lists the files and reads stored ones", async () => {
    const zip = openZip(
      storedZip({ mimetype: "application/epub+zip", "OEBPS/ü.xhtml": "<p/>" }),
    );
    expect(zip.paths).toEqual(["mimetype", "OEBPS/ü.xhtml"]);
    expect(zip.has("OEBPS/ü.xhtml")).toBe(true);
    expect(text(await zip.read("mimetype"))).toBe("application/epub+zip");
    expect(text(await zip.read("OEBPS/ü.xhtml"))).toBe("<p/>");
  });

  it("inflates deflated files", async () => {
    const zip = openZip(deflatedZip(DEFLATED));
    expect(text(await zip.read("a.txt"))).toBe(TEXT);
  });

  it("finds the directory behind an archive comment", async () => {
    const bytes = storedZip({ "a.txt": "x" });
    const comment = utf8("A comment");
    const withComment = new Uint8Array(bytes.length + comment.length);
    withComment.set(bytes);
    withComment.set(comment, bytes.length);
    new DataView(withComment.buffer).setUint16(
      bytes.length - 2,
      comment.length,
      true,
    );
    expect(text(await openZip(withComment).read("a.txt"))).toBe("x");
  });

  it("rejects bytes that aren't a ZIP file", () => {
    expect(() => openZip(utf8("Just some text, renamed to .epub"))).toThrow(
      ZipError,
    );
    expect(() => openZip(new Uint8Array())).toThrow(ZipError);
  });

  it("rejects a file that isn't in the archive", async () => {
    await expect(
      openZip(storedZip({ "a.txt": "x" })).read("b.txt"),
    ).rejects.toThrow(ZipError);
  });

  it("rejects deflated data that doesn't inflate", async () => {
    const zip = openZip(deflatedZip(Uint8Array.from([255, 255, 255, 255])));
    await expect(zip.read("a.txt")).rejects.toThrow();
  });

  it("rejects a stored file with a damaged byte", async () => {
    const bytes = storedZip({ "a.txt": TEXT });
    bytes[30 + "a.txt".length + 7]! ^= 1;
    await expect(openZip(bytes).read("a.txt")).rejects.toThrow(ZipError);
  });

  it("rejects a deflated file that inflates to other bytes", async () => {
    const zip = openZip(deflatedZip(DEFLATED, utf8(TEXT.toUpperCase())));
    await expect(zip.read("a.txt")).rejects.toThrow(ZipError);
  });

  it("rejects an archive cut short", () => {
    const bytes = storedZip({ "a.txt": TEXT });
    expect(() => openZip(bytes.slice(0, bytes.length - 30))).toThrow(ZipError);
  });

  it("rejects a file encrypted with ZIP's own encryption", async () => {
    const bytes = storedZip({ "a.txt": TEXT });
    const view = new DataView(bytes.buffer);
    const directory = 30 + "a.txt".length + TEXT.length;
    view.setUint16(6, view.getUint16(6, true) | 1, true);
    view.setUint16(
      directory + 8,
      view.getUint16(directory + 8, true) | 1,
      true,
    );
    await expect(openZip(bytes).read("a.txt")).rejects.toThrow(ZipError);
  });
});
