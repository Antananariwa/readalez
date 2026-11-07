// The web APIs `src/core/` may use (ADR 0009). Each one is in WinterTC's
// Minimum Common Web API, so Node has it as well as browsers:
// https://github.com/WinterTC55/proposal-minimum-common-api/blob/008b840d4eb624c5ab466b069a79cbea67d57c90/index.bs
// Each is declared here by hand, with only the parts core uses, and with a
// link showing that the target browsers have it (SPEC.md, Devices and
// browsers). Anything not declared here still fails the typecheck in core.

/**
 * Decodes text. Safari 10.1, Chrome 38, Firefox 19:
 * https://github.com/mdn/browser-compat-data/blob/82daeebf5a7073d55223a8cdb8aa54fb9416e27d/api/TextDecoder.json
 */
declare class TextDecoder {
  constructor(label?: "utf-8" | "utf-16le" | "utf-16be");
  /** Replaces bytes that aren't valid in the encoding with U+FFFD. */
  decode(input: Uint8Array): string;
}

/**
 * Inflates DEFLATE data. `deflate-raw` is in Safari 16.4, Chrome 103 and
 * Firefox 113:
 * https://github.com/mdn/browser-compat-data/blob/82daeebf5a7073d55223a8cdb8aa54fb9416e27d/api/DecompressionStream.json
 */
declare class DecompressionStream {
  constructor(format: "deflate-raw");
  readonly writable: {
    getWriter(): {
      write(chunk: Uint8Array): Promise<void>;
      close(): Promise<void>;
    };
  };
  readonly readable: {
    getReader(): {
      read(): Promise<
        { done: false; value: Uint8Array } | { done: true; value?: undefined }
      >;
    };
  };
}
