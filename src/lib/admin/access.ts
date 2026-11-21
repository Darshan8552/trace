import "server-only";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

export function parseEmailList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const emails = value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);

  return [...new Set(emails)];
}

export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string[],
): boolean {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();

  return normalized.length > 0 && allowlist.includes(normalized);
}

export function isConfiguredAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email, parseEmailList(serverEnv().ADMIN_EMAILS));
}

export function isAdminUser(
  user: { email?: string | null; role?: string | null } | null | undefined,
): boolean {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  return isConfiguredAdmin(user.email);
}

export function readBearerToken(authorization: string | null): string | null {
  const match = /^Bearer\s+(\S.*)$/i.exec((authorization ?? "").trim());

  return match?.[1]?.trim() || null;
}

export function secretsMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(providedBytes, expectedBytes);
}

export function hasMachineAccess(authorization: string | null): boolean {
  const secret = serverEnv().REINDEX_SECRET;
  const token = readBearerToken(authorization);

  if (!secret || !token) {
    return false;
  }

  return secretsMatch(token, secret);
}
