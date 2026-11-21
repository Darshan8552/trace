export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="animate-pulse space-y-5">
      {Array.from({ length: fields }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder row
          key={index}
          className="space-y-2"
        >
          <div className="h-3.5 w-16 rounded-[2px] bg-secondary/60" />
          <div className="h-10 rounded-[3px] bg-secondary/40" />
        </div>
      ))}
      <div className="h-10 rounded-[3px] bg-secondary/60" />
    </div>
  );
}
