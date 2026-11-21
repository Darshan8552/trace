export function Quote() {
  return (
    <section className="border-b border-border py-20 lg:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <figure className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <blockquote className="max-w-[24ch] font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.03] tracking-[-0.025em] text-balance lg:col-span-9">
            A search result gives you a link.{" "}
            <span className="trace-underline">
              Trace gives you the sentence.
            </span>
          </blockquote>
          <figcaption className="border-t border-border pt-3 font-mono text-[0.65rem] text-muted-foreground lg:col-span-3">
            The idea behind Trace / 001
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
