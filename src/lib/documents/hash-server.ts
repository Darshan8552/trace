import "server-only";
import { createHash } from "node:crypto";
import { bytesToHex } from "./hash";

export function hashText(text: string): string {
  return bytesToHex(createHash("sha256").update(text).digest());
}

export function hashBytes(bytes: Uint8Array): string {
  return bytesToHex(createHash("sha256").update(bytes).digest());
}
