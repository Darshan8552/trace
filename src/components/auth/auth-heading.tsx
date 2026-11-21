export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
        <span aria-hidden="true" className="h-px w-4 bg-highlight" />
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,2.5rem)] leading-[1.05] tracking-[-0.02em] text-balance">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
