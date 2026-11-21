export function ChatPageFallback() {
  return (
    <>
      <div className="h-12 shrink-0 animate-pulse border-b border-border lg:hidden" />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex min-h-0 w-full max-w-[96rem] flex-1 gap-8 px-5 py-6 sm:px-8 sm:py-8">
          <div className="hidden min-h-0 w-64 shrink-0 flex-col border-r border-border pr-6 lg:flex">
            <div className="flex animate-pulse items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="h-2.5 w-24 rounded-[2px] bg-secondary/50" />
                <div className="mt-2 h-6 w-20 rounded-[2px] bg-secondary/60" />
              </div>
              <div className="h-7 w-7 rounded-[2px] bg-secondary/60" />
            </div>
            <div className="mt-4 space-y-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-[3px] border border-border bg-surface/50"
                />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 animate-pulse flex-col">
            <div className="border-b border-border pb-3">
              <div className="h-3 w-24 rounded-[2px] bg-secondary/60" />
              <div className="mt-2 h-6 w-56 rounded-[2px] bg-secondary/60" />
            </div>
            <div className="flex flex-1 flex-col justify-center py-6">
              <div className="h-2.5 w-32 rounded-[2px] bg-secondary/50" />
              <div className="mt-4 h-9 w-80 max-w-full rounded-[2px] bg-secondary/60" />
              <div className="mt-3 h-4 w-72 max-w-full rounded-[2px] bg-secondary/40" />
              <div className="mt-6 h-10 w-36 rounded-[3px] bg-secondary/60" />
            </div>
            <div className="mt-8 h-20 rounded-[3px] border border-border bg-surface/60" />
          </div>
        </div>
      </main>
    </>
  );
}

export function SourceViewerFallback() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="size-8 rounded-[2px] bg-secondary/60" />
          <div className="flex-1">
            <div className="h-2.5 w-28 rounded-[2px] bg-secondary/50" />
            <div className="mt-2 h-7 w-64 max-w-full rounded-[2px] bg-secondary/60" />
            <div className="mt-2 h-2.5 w-48 max-w-full rounded-[2px] bg-secondary/40" />
          </div>
        </div>
        <div className="mt-6 h-10 rounded-[2px] border border-border bg-surface/60" />
        <div className="mt-8 space-y-5">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border-l-2 border-border pl-4">
              <div className="h-2.5 w-24 rounded-[2px] bg-secondary/50" />
              <div className="mt-3 h-3 w-full rounded-[2px] bg-secondary/40" />
              <div className="mt-2 h-3 w-5/6 rounded-[2px] bg-secondary/30" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ChatLibraryFallback() {
  return (
    <>
      <div className="h-14 shrink-0 animate-pulse border-b border-border" />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 pb-16 sm:px-8 sm:pt-14">
          <div className="flex animate-pulse flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
            <div>
              <div className="h-2.5 w-32 rounded-[2px] bg-secondary/50" />
              <div className="mt-4 h-10 w-64 max-w-full rounded-[2px] bg-secondary/60" />
              <div className="mt-3 h-4 w-80 max-w-full rounded-[2px] bg-secondary/40" />
            </div>
            <div className="h-10 w-28 rounded-[3px] bg-secondary/60" />
          </div>

          <div className="mt-6 flex animate-pulse items-center justify-between">
            <div className="h-2.5 w-20 rounded-[2px] bg-secondary/40" />
            <div className="h-2.5 w-20 rounded-[2px] bg-secondary/40" />
          </div>

          <div className="mt-4 border-t border-border">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-4 border-b border-border py-5"
              >
                <div className="h-2.5 w-4 rounded-[2px] bg-secondary/40" />
                <div className="flex-1">
                  <div className="h-5 w-56 max-w-full rounded-[2px] bg-secondary/60" />
                  <div className="mt-2 h-3 w-80 max-w-full rounded-[2px] bg-secondary/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
