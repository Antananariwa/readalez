// Which files in an EPUB are locked by copy protection (DRM), from
// `META-INF/encryption.xml` (SPEC.md feature 2). EPUB 3.3 lists every
// encrypted file there, each in an `EncryptedData` element with its
// `EncryptionMethod` and a `CipherReference` whose URI is relative to the
// container's root:
// https://github.com/w3c/epub-specs/blob/634943927a300e607bec7d34a19c422f3344b517/epub33/core/index.html#L2391-L2449
// https://github.com/w3c/epub-specs/blob/634943927a300e607bec7d34a19c422f3344b517/epub33/core/index.html#L2088-L2093
// Font obfuscation uses the same file but isn't encryption: it only scrambles
// fonts, which Readalez never reads. Any other algorithm is taken as DRM, as
// calibre does when it imports an EPUB: `process_encryption` returns False
// for any algorithm but these two, and its caller then raises DRMError:
// https://github.com/kovidgoyal/calibre/blob/be4a47bd5ba1da3dc10a46f7e4eeea3598d3295b/src/calibre/ebooks/conversion/plugins/epub_input.py#L21-L22
// https://github.com/kovidgoyal/calibre/blob/be4a47bd5ba1da3dc10a46f7e4eeea3598d3295b/src/calibre/ebooks/conversion/plugins/epub_input.py#L82-L85
// https://github.com/kovidgoyal/calibre/blob/be4a47bd5ba1da3dc10a46f7e4eeea3598d3295b/src/calibre/ebooks/conversion/plugins/epub_input.py#L317-L318
// Unlike calibre, a book is refused only when a file Readalez reads is
// locked, so a book whose fonts alone are locked still opens.

import { resolveHref } from "./package.ts";
import { descendantsNamed, type XmlElement } from "./xml.ts";

/** Font obfuscation's algorithms: IDPF's, from EPUB 3.3, and Adobe's. */
const OBFUSCATION = new Set([
  "http://www.idpf.org/2008/embedding",
  "http://ns.adobe.com/pdf/enc#RC",
]);

/**
 * The paths of the files encrypted with anything other than font
 * obfuscation.
 */
export function lockedPaths(encryption: XmlElement): Set<string> {
  const locked = new Set<string>();
  for (const data of descendantsNamed(encryption, "EncryptedData")) {
    const algorithm =
      descendantsNamed(data, "EncryptionMethod")[0]?.attributes.get(
        "Algorithm",
      ) ?? "";
    if (OBFUSCATION.has(algorithm)) continue;
    for (const reference of descendantsNamed(data, "CipherReference")) {
      const uri = reference.attributes.get("URI");
      const target = uri === undefined ? null : resolveHref("", uri);
      if (target) locked.add(target.path);
    }
  }
  return locked;
}
