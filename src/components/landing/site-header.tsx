"use client";

import { cn } from "cn";
import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TraceLogo } from "@/components/brand/trace-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

const navigation = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Trace", href: "#why-trace" },
  { label: "Privacy", href: "#privacy" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-5 sm:px-8">
        <TraceLogo />

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm text-[0.8rem] text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <nav className="hidden items-center gap-2 md:flex" aria-label="Auth">
            <Link
              href="/signin"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground",
              )}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-9 px-4",
              )}
            >
              Get started
            </Link>
          </nav>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
          >
            {open ? (
              <XIcon aria-hidden="true" className="size-5" />
            ) : (
              <MenuIcon aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-border/70 bg-background px-5 pb-5 pt-2 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm text-foreground outline-none last:border-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/signin"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "mt-2 h-10 w-full",
              )}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "mt-2 h-10 w-full",
              )}
            >
              Get started
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
