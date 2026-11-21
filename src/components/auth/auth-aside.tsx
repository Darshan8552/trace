import { FileTextIcon } from "lucide-react";
import { TraceLogo } from "@/components/brand/trace-logo";

export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-pine text-pine-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div className="relative flex items-center justify-between">
        <TraceLogo className="text-pine-foreground" />
        <span className="font-mono text-[0.64rem] text-pine-foreground/45">
          REF / 001
        </span>
      </div>

      <div className="relative max-w-md">
        <p className="font-mono text-[0.65rem] text-pine-foreground/55">
          Answers you can trace
        </p>
        <p className="mt-4 font-display text-[2.75rem] leading-[1.02] tracking-[-0.02em]">
          Ask the file,
          <br />
          not the internet.
        </p>

        <figure className="mt-10 max-w-sm border border-pine-foreground/15 bg-surface p-4 text-foreground">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <FileTextIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <p className="min-w-0 flex-1 truncate font-mono text-[0.68rem]">
              Studio_Lease_2026.pdf
            </p>
            <span className="font-mono text-[0.62rem] text-highlight">
              p. 7
            </span>
          </div>
          <p className="mt-3 font-display text-[0.9375rem] leading-7">
            The lease does not allow pets unless your landlord agrees first.{" "}
            <span className="trace-mark">
              No pets are permitted without the landlord&rsquo;s written
              consent.
            </span>
          </p>
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
            <span className="font-mono text-[0.64rem] text-highlight">01</span>
            <span className="text-[0.68rem] text-muted-foreground">
              Pets clause, second paragraph
            </span>
          </div>
        </figure>
      </div>

      <p className="relative max-w-xs text-sm leading-6 text-pine-foreground/55">
        Every answer keeps its source attached. No page number, no answer.
      </p>
    </aside>
  );
}
