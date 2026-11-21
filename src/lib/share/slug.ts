import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function newShareSlug(): string {
  return [...randomBytes(24)]
    .map((byte) => ALPHABET[byte % ALPHABET.length])
    .join("");
}
