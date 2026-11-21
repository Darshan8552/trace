import { GUEST_ONLY_PATHS } from "@/lib/auth-routes";

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/chat",
) {
  if (!value) {
    return fallback;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback;
  }

  const pathname = value.split("?")[0].split("#")[0];

  if (GUEST_ONLY_PATHS.has(pathname)) {
    return fallback;
  }

  return value;
}
