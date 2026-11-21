import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/chat", "/settings", "/admin"];
const LANDING_PATH = "/";

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const path = `${pathname}${search}`;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !getSessionCookie(request)) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", path);
    return withSecurityHeaders(NextResponse.redirect(signInUrl));
  }

  if (pathname === LANDING_PATH && getSessionCookie(request)) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/chat", request.url)),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
  );
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
