import { cn } from "cn";
import Link from "next/link";

export function TraceMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={cn("size-7", className)}
      fill="none"
    >
      <path
        d="M5.5 4v20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.5 8.25h11M10.5 13.25h11M10.5 18.25h5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="17" y="16.5" width="6.5" height="3.5" fill="var(--highlight)" />
    </svg>
  );
}

export function TraceLogo({
  className,
  markClassName,
  href = "/",
}: {
  className?: string;
  markClassName?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Trace home"
      className={cn(
        "inline-flex items-center gap-2.5 text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <TraceMark className={markClassName} />
      <span className="font-display text-[1.65rem] leading-none tracking-[-0.02em]">
        Trace
      </span>
    </Link>
  );
}
