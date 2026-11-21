import { TraceLogo } from "@/components/brand/trace-logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <TraceLogo
            href="/"
            markClassName="size-5"
            className="text-[1.2rem]"
          />
          <span className="border border-border px-1.5 py-0.5 font-mono text-[0.56rem] tracking-[0.08em] text-muted-foreground uppercase">
            Read only
          </span>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
