const assurances = [
  {
    title: "Only you can open your files",
    description:
      "Uploads are private to your account and are never shared with other users.",
  },
  {
    title: "Delete means delete",
    description:
      "Remove a chat and its files, passages, and answers leave your workspace together.",
  },
  {
    title: "Never used for training",
    description:
      "Your documents are not used to train public models. They are there to answer your questions.",
  },
];

export function Privacy() {
  return (
    <section
      id="privacy"
      className="relative scroll-mt-20 border-y border-border bg-pine py-20 text-pine-foreground lg:py-24"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-highlight/70"
      />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="font-mono text-[0.65rem] text-pine-foreground/55">
            Privacy / no training
          </p>
          <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.05] tracking-[-0.02em] text-balance">
            Your files are not training data.
          </h2>
          <p className="mt-5 max-w-[34ch] text-sm leading-6 text-pine-foreground/75">
            Privacy is part of how the answer is produced, not a setting buried
            three screens deep.
          </p>
        </div>

        <dl className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
          {assurances.map((item, index) => (
            <div
              key={item.title}
              className="border-t border-pine-foreground/25 pt-4"
            >
              <dt className="flex items-baseline gap-2 text-sm leading-6 font-medium">
                <span className="font-mono text-[0.62rem] text-highlight-on-pine">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.title}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-pine-foreground/75">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
