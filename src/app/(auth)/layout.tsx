import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthAside } from "@/components/auth/auth-aside";
import { TraceLogo } from "@/components/brand/trace-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { GUEST_ONLY_PATHS } from "@/lib/auth-routes";
import { safeNextPath } from "@/lib/redirects";

function AuthShellFallback() {
  return (
    <div className="flex min-h-dvh animate-pulse">
      <div className="hidden flex-1 bg-pine lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-20" />
        <div className="mx-auto w-full max-w-100 px-5">
          <div className="h-72 rounded-[3px] bg-secondary/40" />
        </div>
      </div>
    </div>
  );
}

async function AuthShell({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const requestPath = requestHeaders.get("x-pathname") ?? "";
  const [pathname, query = ""] = requestPath.split("?");

  if (pathname && GUEST_ONLY_PATHS.has(pathname)) {
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (session) {
      redirect(safeNextPath(new URLSearchParams(query).get("next")));
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <AuthAside />

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:justify-end">
          <div className="lg:hidden">
            <TraceLogo />
          </div>
          <ThemeToggle />
        </header>

        <main
          id="main"
          className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:px-8 sm:pt-8 lg:items-center lg:pt-0"
        >
          <div className="w-full max-w-100">{children}</div>
        </main>

        <footer className="px-5 pb-6 sm:px-8">
          <p className="font-mono text-[0.64rem] text-muted-foreground">
            <Link
              href="/"
              className="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Trace
            </Link>{" "}
            · © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthShellFallback />}>
      <AuthShell>{children}</AuthShell>
    </Suspense>
  );
}
