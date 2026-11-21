const MAX_QUERY_CHARS = 240;

export const REWRITE_INSTRUCTIONS = [
  "You rewrite a user's latest question into one standalone search query.",
  "Use the conversation only to resolve pronouns and missing subjects.",
  "Keep names, numbers, and technical terms exactly as written.",
  "Return the query on a single line with no quotes, labels, or explanation.",
  "Never answer the question.",
].join(" ");

export function normalizeRewrittenQuery(raw: string): string | null {
  const line = raw
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  if (!line) {
    return null;
  }

  const unquoted = line
    .replace(/^["'`\u201c\u201d\u2018\u2019]+/, "")
    .replace(/["'`\u201c\u201d\u2018\u2019]+$/, "")
    .slice(0, MAX_QUERY_CHARS)
    .replace(/\s+/g, " ")
    .trim();

  return unquoted.length > 0 ? unquoted : null;
}
