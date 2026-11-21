import { cn } from "cn";
import { UploadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section id="start" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="relative overflow-hidden border border-border bg-surface px-6 py-10 sm:px-10 lg:flex lg:items-end lg:justify-between lg:gap-10">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[3px] bg-highlight"
          />
          <div>
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              Start / one file is enough
            </p>
            <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.025em] text-balance">
              Ask your first file a question.
            </h2>
            <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-7 text-muted-foreground">
              One PDF is enough. Add the rest when you need them.
            </p>
          </div>

          <div className="mt-8 flex shrink-0 flex-col items-start gap-3 lg:mt-0">
            <a
              href="#sample"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-12 gap-2 px-6 text-[0.95rem]",
              )}
            >
              <UploadIcon aria-hidden="true" className="size-4" />
              Upload a file
            </a>
            <p className="font-mono text-[0.62rem] leading-5 text-muted-foreground">
              No credit card. Start with a single document.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
