import { cn } from "cn";
import Link from "next/link";

export function initialsForName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountChip({
  name,
  showName = "responsive",
  className,
}: {
  name: string;
  showName?: "responsive" | "always";
  className?: string;
}) {
  return (
    <Link
      href="/settings"
      aria-label={`${initialsForName(name)}${name} — account settings`}
      title="Settings"
      className={cn(
        "flex min-w-0 items-center gap-2.5 transition-colors hover:text-highlight focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center border border-border bg-surface font-mono text-[0.62rem] font-medium text-foreground"
      >
        {initialsForName(name) || "T"}
      </span>
      <span
        className={cn(
          "max-w-40 truncate text-sm font-medium",
          showName === "responsive" && "hidden sm:block",
        )}
      >
        {name}
      </span>
    </Link>
  );
}
