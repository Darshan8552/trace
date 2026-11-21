"use client";

import { RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { TraceLogo } from "@/components/brand/trace-logo";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8">
      <TraceLogo />

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pb-20">
        <p className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
          <span aria-hidden="true" className="h-px w-4 bg-highlight" />
          Something broke
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.02] tracking-[-0.02em] text-balance">
          The thread slipped.
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-6 text-muted-foreground">
          This page hit an unexpected error. Your documents and messages are
          unaffected — try again, or head back to your notebooks.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={reset} className="h-9 px-3">
            <RotateCcwIcon aria-hidden="true" className="size-3.5" />
            Try again
          </Button>
          <Link
            href="/chat"
            className={buttonVariants({
              variant: "outline",
              className: "h-9 px-3",
            })}
          >
            All notebooks
          </Link>
        </div>

        {error.digest ? (
          <p className="mt-8 font-mono text-[0.6rem] text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  );
}
