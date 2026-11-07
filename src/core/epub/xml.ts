// A small XML reader for EPUB files (ADR 0009): the package, container, table
// of contents and XHTML documents. It builds a tree of elements and text and
// checks that tags nest. It doesn't validate, read DTDs or resolve
// namespaces: names keep their prefixes, and `localName` drops them.

/** An element: its name as written (`dc:title`), attributes and children. */
export interface XmlElement {
  name: string;
  attributes: ReadonlyMap<string, string>;
  children: XmlNode[];
}

/** An element or a run of text, with entities already replaced. */
export type XmlNode = XmlElement | string;

/** Thrown when the text isn't well-formed enough to read. */
export class XmlError extends Error {}

const NAME = /[^\s/>=]+/y;
const ATTRIBUTE = /\s+([^\s/>=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/y;
const TAG_END = /\s*(\/?)>/y;
const ENTITY = /&(?:#[xX]([0-9a-fA-F]+)|#([0-9]+)|([A-Za-z][\w.-]*));/g;
const PREDEFINED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Reads an XML document and returns its root element. */
export function parseXml(text: string): XmlElement {
  const top: XmlElement = { name: "", attributes: new Map(), children: [] };
  const open: XmlElement[] = [top];
  let i = 0;

  const addText = (value: string) => {
    // Text outside the root element is only whitespace in a document.
    if (open.length === 1 || value === "") return;
    const { children } = open.at(-1)!;
    const last = children.at(-1);
    if (typeof last === "string") children[children.length - 1] = last + value;
    else children.push(value);
  };
  const skipPast = (end: string, from: number) => {
    const at = text.indexOf(end, from);
    if (at === -1) throw new XmlError(`Missing ${end}`);
    return at + end.length;
  };

  while (i < text.length) {
    const lt = text.indexOf("<", i);
    if (lt === -1) {
      addText(decodeEntities(text.slice(i)));
      break;
    }
    addText(decodeEntities(text.slice(i, lt)));
    if (text.startsWith("<!--", lt)) {
      i = skipPast("-->", lt + 4);
    } else if (text.startsWith("<![CDATA[", lt)) {
      const end = skipPast("]]>", lt + 9);
      addText(text.slice(lt + 9, end - 3));
      i = end;
    } else if (text.startsWith("<?", lt)) {
      i = skipPast("?>", lt + 2);
    } else if (text.startsWith("<!", lt)) {
      i = skipDeclaration(text, lt);
    } else if (text[lt + 1] === "/") {
      const end = skipPast(">", lt + 2);
      const name = text.slice(lt + 2, end - 1).trim();
      const element = open.pop();
      if (open.length === 0 || element?.name !== name) {
        throw new XmlError(`Unexpected </${name}>`);
      }
      i = end;
    } else {
      NAME.lastIndex = lt + 1;
      const name = NAME.exec(text)?.[0];
      if (!name) throw new XmlError(`Bad tag at ${lt}`);
      const attributes = new Map<string, string>();
      let at = NAME.lastIndex;
      for (;;) {
        ATTRIBUTE.lastIndex = at;
        const match = ATTRIBUTE.exec(text);
        if (!match) break;
        const value = match[2] ?? match[3] ?? "";
        attributes.set(
          match[1]!,
          decodeEntities(value.replace(/[\t\n\r]/g, " ")),
        );
        at = ATTRIBUTE.lastIndex;
      }
      TAG_END.lastIndex = at;
      const end = TAG_END.exec(text);
      if (!end) throw new XmlError(`Bad tag <${name}>`);
      const element: XmlElement = { name, attributes, children: [] };
      open.at(-1)!.children.push(element);
      if (end[1] !== "/") open.push(element);
      i = TAG_END.lastIndex;
    }
  }

  if (open.length !== 1) throw new XmlError(`Unclosed <${open.at(-1)!.name}>`);
  const root = top.children.find((node) => typeof node !== "string");
  if (!root) throw new XmlError("No root element");
  return root;
}

/** Skips `<!DOCTYPE …>`, including an internal subset in brackets. */
function skipDeclaration(text: string, from: number): number {
  let inSubset = false;
  for (let i = from + 2; i < text.length; i++) {
    const char = text[i];
    if (char === "[") inSubset = true;
    else if (char === "]") inSubset = false;
    else if (char === ">" && !inSubset) return i + 1;
  }
  throw new XmlError("Unclosed <!");
}

/**
 * Replaces XML's five named entities and numeric references. Other named
 * entities need a DTD, which this reader doesn't load, so they stay as
 * written (docs/known-issues.md).
 */
function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(ENTITY, (whole, hex, decimal, name) => {
    if (name !== undefined) return PREDEFINED[name] ?? whole;
    const code = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

/** The name without its prefix: `title` for `dc:title`. */
export function localName(name: string): string {
  return name.slice(name.indexOf(":") + 1);
}

/** The child elements, in order. */
export function elements(element: XmlElement): XmlElement[] {
  return element.children.filter((node) => typeof node !== "string");
}

/** The child elements with this local name. */
export function childrenNamed(element: XmlElement, name: string): XmlElement[] {
  return elements(element).filter((child) => localName(child.name) === name);
}

/** Every element below this one with this local name, in document order. */
export function descendantsNamed(
  element: XmlElement,
  name: string,
): XmlElement[] {
  const found: XmlElement[] = [];
  const visit = (parent: XmlElement) => {
    for (const child of elements(parent)) {
      if (localName(child.name) === name) found.push(child);
      visit(child);
    }
  };
  visit(element);
  return found;
}

/** All the text inside the element. */
export function textContent(element: XmlElement): string {
  return element.children
    .map((node) => (typeof node === "string" ? node : textContent(node)))
    .join("");
}

/** The text with runs of whitespace as one space, trimmed. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

/** The space-separated tokens of an attribute, such as `class`. */
export function tokens(element: XmlElement, attribute: string): string[] {
  return (element.attributes.get(attribute) ?? "").split(/\s+/).filter(Boolean);
}
