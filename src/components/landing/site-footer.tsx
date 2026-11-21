import { TraceLogo } from "@/components/brand/trace-logo";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Trace", href: "#why-trace" },
  { label: "Privacy", href: "#privacy" },
];

export function SiteFooter() {
  return (
    <footer className="bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="flex flex-col gap-2">
          <TraceLogo markClassName="size-6" />
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Answers you can trace.
          </p>
        </div>

        <nav aria-label="Footer" className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-[0.64rem] text-muted-foreground">
          © 2026 Trace
        </p>
      </div>
    </footer>
  );
}
