import { cn } from "cn";
import {
  ArrowUpIcon,
  FileTextIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 pt-12 pb-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-14 lg:pt-20 lg:pb-28">
        <div className="lg:col-span-5">
          <p className="font-mono text-[0.7rem] tracking-[0.04em] text-muted-foreground">
            Trace / document reading desk
          </p>
          <h1 className="mt-5 max-w-[15ch] font-display text-[clamp(3rem,6.4vw,4.75rem)] leading-[0.98] tracking-[-0.03em] text-balance">
            Ask the file, not the internet.
          </h1>
          <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-7 text-muted-foreground">
            Upload a PDF, a Word file, or your own notes. Trace reads it, finds
            the right passage, and answers with the page it came from.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#start"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-11 gap-2 px-5 text-[0.95rem]",
              )}
            >
              <UploadIcon aria-hidden="true" className="size-4" />
              Upload a file
            </a>
            <a
              href="#sample"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 px-5 text-[0.95rem]",
              )}
            >
              See a sample answer
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-4">
            {[
              ["10", "sources per chat"],
              ["4", "file formats"],
              ["1", "page per citation"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl leading-none">{value}</dt>
                <dd className="mt-1.5 text-[0.7rem] leading-4 text-muted-foreground">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="sample" className="scroll-mt-24 lg:col-span-7">
          <div className="relative mx-auto max-w-[39rem] lg:mr-0">
            <div
              aria-hidden="true"
              className="absolute -top-2 right-4 left-4 h-full border border-border/70 bg-surface/50"
            />

            <figure className="relative border border-border bg-card">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] bg-highlight"
              />

              <div className="flex items-center gap-3 border-b border-border px-5 py-3 sm:px-6">
                <FileTextIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[0.72rem]">
                    Studio_Lease_2026.pdf
                  </p>
                  <p className="mt-0.5 font-mono text-[0.62rem] text-muted-foreground">
                    8 pages / index 001
                  </p>
                </div>
                <span className="shrink-0 border border-highlight/40 px-1.5 py-0.5 font-mono text-[0.62rem] tracking-[0.08em] text-highlight uppercase">
                  Indexed
                </span>
              </div>

              <div className="px-5 py-6 sm:px-6">
                <div className="flex items-start gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.62rem] text-muted-foreground">
                      Question
                    </p>
                    <p className="mt-1.5 max-w-[28ch] font-display text-[1.15rem] leading-snug italic">
                      Can I keep a cat in the apartment?
                    </p>

                    <div className="mt-6 border-t border-border pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-mono text-[0.62rem] text-muted-foreground">
                          Trace / answer
                        </p>
                        <p className="font-mono text-[0.62rem] text-highlight">
                          [1] p. 7
                        </p>
                      </div>
                      <p className="mt-2.5 font-display text-[1.05rem] leading-8">
                        The lease does not allow pets unless your landlord
                        agrees in writing first.{" "}
                        <span className="trace-mark">
                          No pets are permitted without the landlord&rsquo;s
                          written consent.
                        </span>
                      </p>
                    </div>
                  </div>

                  <aside className="hidden w-32 shrink-0 border-l border-border pl-4 sm:block">
                    <p className="font-mono text-[0.62rem] text-highlight">
                      01
                    </p>
                    <p className="mt-1.5 text-xs leading-5 font-medium">
                      Studio_Lease_2026.pdf
                    </p>
                    <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">
                      Page 7
                    </p>
                    <p className="mt-3 text-[0.7rem] leading-5 text-muted-foreground">
                      Pets clause, second paragraph
                    </p>
                  </aside>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="flex items-center gap-3 border-t border-border px-5 py-3 sm:px-6"
              >
                <span className="flex h-9 flex-1 items-center border border-border/70 bg-background px-3 text-[0.8125rem] text-muted-foreground">
                  Ask a follow-up about this file
                </span>
                <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground">
                  <ArrowUpIcon className="size-4" />
                </span>
              </div>

              <figcaption className="sr-only">
                Example conversation about a lease, with the answer citing page
                seven.
              </figcaption>
            </figure>

            <p className="mt-4 flex items-center justify-end gap-2 font-mono text-[0.65rem] text-muted-foreground">
              <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
              Every answer keeps its source attached.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
