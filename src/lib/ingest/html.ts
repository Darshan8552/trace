import "server-only";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const MAX_TEXT_CHARS = 200_000;

const BLOCK_TAGS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "BR",
  "DD",
  "DIV",
  "DL",
  "DT",
  "FIELDSET",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "MAIN",
  "NAV",
  "OL",
  "P",
  "PRE",
  "SECTION",
  "TABLE",
  "TD",
  "TH",
  "TR",
  "UL",
]);

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "FORM"]);

type NodeLike = {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: NodeLike[];
};

function collectText(node: NodeLike, parts: string[]): void {
  if (node.nodeType === 3) {
    parts.push(node.textContent ?? "");
    return;
  }

  if (node.nodeType !== 1) {
    return;
  }

  const name = node.nodeName.toUpperCase();

  if (SKIP_TAGS.has(name)) {
    return;
  }

  for (const child of node.childNodes ?? []) {
    collectText(child, parts);
  }

  if (BLOCK_TAGS.has(name)) {
    parts.push("\n");
  }
}

function normalizeText(parts: string[]): string {
  return parts
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function textFromHtml(html: string): string {
  const { document } = parseHTML(html);
  const body = document.body;
  const root = (body && body.childNodes.length > 0
    ? body
    : document.documentElement) as unknown as NodeLike;
  const parts: string[] = [];

  collectText(root, parts);

  return normalizeText(parts);
}

export function htmlToReadableText(html: string): {
  title: string | null;
  text: string;
} {
  const { document } = parseHTML(html);
  const fallbackTitle = document.title?.trim() || null;
  const article = new Readability(document as unknown as Document).parse();
  const articleText = article?.content ? textFromHtml(article.content) : "";
  const text = articleText || textFromHtml(html);

  return {
    title: article?.title?.trim() || fallbackTitle,
    text,
  };
}

export function plainTextToReadable(text: string): string {
  return normalizeText([text]);
}
