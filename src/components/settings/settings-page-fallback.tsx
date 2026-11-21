export function SettingsPageFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-16 sm:px-8 sm:pt-12">
        <div className="h-3 w-28 animate-pulse rounded-[2px] bg-secondary/50" />
        <div className="mt-8 h-2.5 w-32 animate-pulse rounded-[2px] bg-secondary/40" />
        <div className="mt-3 h-10 w-48 animate-pulse rounded-[2px] bg-secondary/60" />
        <div className="mt-4 h-4 w-80 max-w-full animate-pulse rounded-[2px] bg-secondary/40" />

        <div className="mt-8 border-t border-border">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="grid gap-4 border-b border-border py-8 sm:grid-cols-[10rem_1fr] sm:gap-8"
            >
              <div>
                <div className="h-2.5 w-20 animate-pulse rounded-[2px] bg-secondary/50" />
                <div className="mt-3 h-3 w-32 animate-pulse rounded-[2px] bg-secondary/30" />
              </div>
              <div className="space-y-3">
                <div className="h-9 w-full max-w-sm animate-pulse rounded-[3px] border border-border bg-surface/50" />
                <div className="h-3 w-48 animate-pulse rounded-[2px] bg-secondary/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
