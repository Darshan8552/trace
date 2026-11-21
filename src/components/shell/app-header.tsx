import { cn } from "cn";
import { ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TraceLogo } from "@/components/brand/trace-logo";
import { AccountChip } from "@/components/shell/account-chip";
import { AccountMenu } from "@/components/shell/account-menu";
import { CommandPaletteTrigger } from "@/components/shell/command-palette-trigger";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({
  user,
  variant = "default",
  section = "chats",
  isAdmin = false,
  className,
}: {
  user: { name: string };
  variant?: "default" | "compact";
  section?: string;
  isAdmin?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between gap-3 px-5 sm:px-8",
          variant === "compact" ? "h-12 max-w-[96rem]" : "h-14 max-w-6xl gap-4",
        )}
      >
        <div className="flex items-center gap-4">
          <TraceLogo
            href="/chat"
            markClassName="size-6"
            className="text-[1.35rem] hover:text-highlight"
          />
          {variant === "default" ? (
            <>
              <span
                aria-hidden="true"
                className="hidden h-4 w-px bg-border sm:block"
              />
              <span className="hidden font-mono text-[0.62rem] text-muted-foreground sm:block">
                Workspace / {section}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <CommandPaletteTrigger />
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-[2px] px-1.5 py-1 font-mono text-[0.62rem] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
              <span className="sr-only sm:not-sr-only">Operations</span>
            </Link>
          ) : null}

          {variant === "compact" ? (
            <AccountMenu
              name={user.name}
              variant="compact"
              side="bottom"
              align="end"
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <ThemeToggle />
              <AccountChip
                name={user.name}
                className="ml-1 border-l border-border pl-2.5 sm:pl-3"
              />
              <SignOutButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
