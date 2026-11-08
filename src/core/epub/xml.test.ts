import { describe, expect, it } from "vitest";
import {
  childrenNamed,
  descendantsNamed,
  localName,
  parseXml,
  textContent,
  XmlError,
} from "./xml.ts";

describe("parseXml", () => {
  it("reads elements, attributes and text", () => {
    const root = parseXml(
      `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><body class='a  b' id="x"><p>One <em>two</em></p><br/></body></html>`,
    );
    expect(root.name).toBe("html");
    const body = childrenNamed(root, "body")[0]!;
    expect(body.attributes.get("class")).toBe("a  b");
    expect(body.attributes.get("id")).toBe("x");
    expect(
      body.children.map((c) => (typeof c === "string" ? c : c.name)),
    ).toEqual(["p", "br"]);
    expect(textContent(body)).toBe("One two");
  });

  it("replaces XML's entities and numeric references", () => {
    const root = parseXml(
      '<p title="&quot;A&quot; &amp; B">&lt;a&gt; &amp; &apos;b&apos; &#8212; &#x2014; &#x1F600;</p>',
    );
    expect(root.attributes.get("title")).toBe('"A" & B');
    expect(textContent(root)).toBe("<a> & 'b' — — 😀");
  });

  it("leaves other named entities as written", () => {
    expect(textContent(parseXml("<p>a&nbsp;b</p>"))).toBe("a&nbsp;b");
  });

  it("keeps CDATA as written and skips comments", () => {
    const root = parseXml("<p>a<!-- <b>no</b> --><![CDATA[<b> & ]]>c</p>");
    expect(root.children).toEqual(["a<b> & c"]);
  });

  it("skips a DOCTYPE with an internal subset", () => {
    const root = parseXml(
      '<!DOCTYPE html [ <!ENTITY e "x"> ]><html><p>a</p></html>',
    );
    expect(textContent(root)).toBe("a");
  });

  it("matches names without their prefix", () => {
    const root = parseXml(
      '<opf:package xmlns:opf="x"><opf:metadata><dc:title>T</dc:title></opf:metadata></opf:package>',
    );
    expect(localName(root.name)).toBe("package");
    expect(textContent(descendantsNamed(root, "title")[0]!)).toBe("T");
  });

  it.each([
    ["<p><b></p></b>"],
    ["<p>"],
    ["<p>a</q>"],
    ["just text"],
    ["<p a=b></p>"],
    ["<p><!-- open</p>"],
  ])("rejects %s", (text) => {
    expect(() => parseXml(text)).toThrow(XmlError);
  });
});
