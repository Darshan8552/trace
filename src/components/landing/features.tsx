const features = [
  {
    title: "Page-level citations",
    description:
      "Answers point to the exact passage, not just the document. You can read the sentence Trace used.",
  },
  {
    title: "Reads your actual formats",
    description:
      "PDF, Word, plain text, and Markdown work side by side, including text you paste straight into a chat.",
  },
  {
    title: "One chat, one set of sources",
    description:
      "Each notebook keeps its own files, thread, and citations. Ask one question and Trace searches that chat only.",
  },
  {
    title: "Private by default",
    description:
      "Your uploads are visible only to you, and removing a chat removes its files and passages with it.",
  },
];

export function Features() {
  return (
    <section
      id="why-trace"
      className="scroll-mt-20 border-b border-border py-20 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-[0.65rem] text-muted-foreground">
              Why Trace / 04 notes
            </p>
            <h2 className="mt-3 max-w-[13ch] font-display text-[clamp(2.25rem,4.4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-balance">
              Don&rsquo;t take our word for it. Take the page number.
            </h2>
            <p className="mt-5 max-w-[38ch] text-[1.0625rem] leading-7 text-muted-foreground">
              A citation is not a footnote added at the end. It is the reason
              you can trust the answer in the first place.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border border-t border-border lg:col-span-7">
          {features.map((feature, index) => (
            <li
              key={feature.title}
              className="grid grid-cols-[2.5rem_1fr] gap-x-5 py-6 first:pt-6"
            >
              <span
                aria-hidden="true"
                className="font-mono text-[0.68rem] text-highlight"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-base font-medium tracking-[-0.01em]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 max-w-[48ch] text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
