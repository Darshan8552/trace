const steps = [
  {
    number: "01",
    title: "Add your files",
    description:
      "Drop in a PDF, Word document, Markdown file, or paste text. Trace reads it and keeps it with this chat.",
  },
  {
    number: "02",
    title: "Ask in your own words",
    description:
      "No search syntax and no filters. Ask the question the way you would ask a person.",
  },
  {
    number: "03",
    title: "Check the source",
    description:
      "Every answer links to the passage and page it came from. Open it and read the original.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              Method / 01–03
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.25rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]">
              Three steps, no setup.
            </h2>
          </div>
          <p className="max-w-[38ch] text-[1.0625rem] leading-7 text-muted-foreground">
            Trace is built for the moment you have a file and a question, not
            for a search syntax tutorial.
          </p>
        </div>

        <ol className="grid gap-x-10 gap-y-0 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="group flex flex-col border-b border-border py-6 md:border-b-0 md:border-r md:py-8 md:pr-8 md:last:border-r-0 md:last:pr-0"
            >
              <span className="font-display text-[2.5rem] leading-none text-highlight">
                {step.number}
              </span>
              <h3 className="mt-6 text-lg font-medium tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[34ch] text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
