import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { htmlToReadableText, plainTextToReadable } from "./html";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 12_000;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;

const TEXT_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "text/plain",
]);

function blockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return true;
  }

  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function blockedIpv6(address: string): boolean {
  const value = address.toLowerCase().split("%")[0];

  if (value === "::" || value === "::1") {
    return true;
  }

  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) {
    return blockedIpv4(mapped[1]);
  }

  if (/^f[cd][0-9a-f]{2}:/.test(value) || /^fe[89ab][0-9a-f]:/.test(value)) {
    return true;
  }

  return /^2001:db8:/.test(value) || /^100:/.test(value);
}

function blockedAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    return blockedIpv4(address);
  }

  if (version === 6) {
    return blockedIpv6(address);
  }

  return true;
}

export async function assertPublicUrl(input: string): Promise<URL> {
  if (input.length > MAX_URL_LENGTH) {
    throw new Error("That URL is too long.");
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid web address.");
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new Error("Only public http and https links are supported.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("That address is not public.");
  }

  if (isIP(hostname)) {
    if (blockedAddress(hostname)) {
      throw new Error("That address is not public.");
    }
  } else {
    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (
      addresses.length === 0 ||
      addresses.some((item) => blockedAddress(item.address))
    ) {
      throw new Error("That address is not public.");
    }
  }

  url.hostname = hostname;
  url.hash = "";

  return url;
}

async function readLimitedBody(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);

  if (declaredLength > MAX_BYTES) {
    throw new Error("That page is too large to add as a source.");
  }

  if (!response.body) {
    throw new Error("That page did not return any content.");
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    total += bytes.length;

    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("That page is too large to add as a source.");
    }

    chunks.push(bytes);
  }

  const merged = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(merged);
}

export type FetchedPage = {
  url: string;
  title: string | null;
  text: string;
};

export async function fetchReadablePage(input: string): Promise<FetchedPage> {
  let current = await assertPublicUrl(input);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
        "user-agent": "TraceBot/1.0 (+document source ingestion)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("That page redirected without a destination.");
      }

      current = await assertPublicUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error(`That page could not be loaded (${response.status}).`);
    }

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      ?.trim()
      .toLowerCase();

    if (!contentType || !TEXT_TYPES.has(contentType)) {
      throw new Error("Only HTML and plain text pages can be added.");
    }

    const body = await readLimitedBody(response);
    const isPlainText = contentType === "text/plain";
    const extracted = isPlainText
      ? { title: null, text: plainTextToReadable(body) }
      : htmlToReadableText(body);

    if (!extracted.text) {
      throw new Error("No readable text was found on that page.");
    }

    return {
      url: current.toString(),
      title: extracted.title?.slice(0, 160) ?? null,
      text: extracted.text,
    };
  }

  throw new Error("That page redirected too many times.");
}
