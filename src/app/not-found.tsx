import type { Metadata } from "next";
import Link from "next/link";
import { TraceLogo } from "@/components/brand/trace-logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found — Trace",
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8">
      <TraceLogo />

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pb-20">
        <p className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
          <span aria-hidden="true" className="h-px w-4 bg-highlight" />
          404 / no trace here
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02] tracking-[-0.02em] text-balance">
          This page left no trace.
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-6 text-muted-foreground">
          The page you asked for does not exist, or it was moved. Head back to
          your notebooks and pick up where you left off.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href="/chat"
            className={buttonVariants({ className: "h-9 px-3" })}
          >
            All notebooks
          </Link>
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "h-9 px-3",
            })}
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
