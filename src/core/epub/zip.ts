// A small ZIP reader for EPUB files (ADR 0009). It reads the central
// directory and the stored and deflated entries, which is all EPUB uses.
// Format: PKWARE's APPNOTE.TXT 6.3.10, sections 4.3.7 (local file header),
// 4.3.12 (central directory) and 4.3.16 (end of central directory), here in
// a copy kept on GitHub:
// https://github.com/bearcove/rc-zip/blob/15fb2e34283104b9b1bcb9396ee71dbc9f89c177/static/appnote.txt
// Deflated data is inflated by the platform's `DecompressionStream`.

/** Thrown when the bytes aren't a ZIP file this reader can read. */
export class ZipError extends Error {}

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const STORED = 0;
const DEFLATED = 8;

interface Entry {
  method: number;
  compressedSize: number;
  /** Where the entry's local header starts. */
  offset: number;
}

/** The files in a ZIP archive, by their full path. */
export interface Zip {
  /** The paths of the files, in the order the directory lists them. */
  readonly paths: readonly string[];
  has(path: string): boolean;
  /** The file's bytes, inflated. Rejects if it isn't in the archive. */
  read(path: string): Promise<Uint8Array>;
}

/** Reads the archive's directory. Throws if `bytes` isn't a ZIP file. */
export function openZip(bytes: Uint8Array<ArrayBuffer>): Zip {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = findEndOfDirectory(view);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries = new Map<string, Entry>();
  const names = new TextDecoder("utf-8");

  for (let n = 0; n < count; n++) {
    if (
      at + 46 > view.byteLength ||
      view.getUint32(at, true) !== DIRECTORY_ENTRY
    ) {
      throw new ZipError("Bad central directory");
    }
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const path = names.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    entries.set(path, {
      method: view.getUint16(at + 10, true),
      compressedSize: view.getUint32(at + 20, true),
      offset: view.getUint32(at + 42, true),
    });
    at += 46 + nameLength + extraLength + commentLength;
  }

  return {
    paths: [...entries.keys()],
    has: (path) => entries.has(path),
    read: async (path) => {
      const entry = entries.get(path);
      if (!entry) throw new ZipError(`No ${path} in the archive`);
      return readEntry(bytes, view, entry);
    },
  };
}

/**
 * The end-of-central-directory record: the last 22 bytes, unless a comment
 * of up to 65,535 bytes follows it.
 */
function findEndOfDirectory(view: DataView): number {
  const last = view.byteLength - 22;
  for (let at = last; at >= Math.max(0, last - 0xffff); at--) {
    if (view.getUint32(at, true) === END_OF_DIRECTORY) return at;
  }
  throw new ZipError("Not a ZIP file");
}

async function readEntry(
  bytes: Uint8Array<ArrayBuffer>,
  view: DataView,
  entry: Entry,
): Promise<Uint8Array> {
  const { offset, compressedSize, method } = entry;
  if (
    offset + 30 > view.byteLength ||
    view.getUint32(offset, true) !== LOCAL_HEADER
  ) {
    throw new ZipError("Bad local header");
  }
  // The local header's name and extra field can differ in length from the
  // directory's, so its own lengths say where the data starts.
  const start =
    offset +
    30 +
    view.getUint16(offset + 26, true) +
    view.getUint16(offset + 28, true);
  const data = bytes.subarray(start, start + compressedSize);
  if (data.length !== compressedSize) throw new ZipError("Truncated entry");
  if (method === STORED) return data;
  if (method === DEFLATED) return inflateRaw(data);
  throw new ZipError(`Unsupported compression method ${method}`);
}

/** Inflates raw DEFLATE data (RFC 1951) with the platform's decompressor. */
async function inflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  // Writing waits for the reader below, so it isn't awaited here. Its
  // errors also reach the reader, which reports them.
  writer.write(data).catch(() => {});
  writer.close().catch(() => {});
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    chunks.push(chunk.value);
    length += chunk.value.length;
  }
  const out = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
