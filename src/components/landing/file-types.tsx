import {
  AlignLeftIcon,
  FileTextIcon,
  FileTypeIcon,
  HashIcon,
  LayersIcon,
  StickyNoteIcon,
} from "lucide-react";

const fileTypes = [
  { label: "PDF", icon: FileTextIcon },
  { label: "Word (.docx)", icon: FileTypeIcon },
  { label: "Plain text", icon: AlignLeftIcon },
  { label: "Markdown", icon: HashIcon },
  { label: "Pasted notes", icon: StickyNoteIcon },
  { label: "Mixed sources", icon: LayersIcon },
];

export function FileTypes() {
  return (
    <section className="border-b border-border bg-surface/40">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10">
        <p className="max-w-[24ch] font-display text-[1.15rem] leading-snug lg:col-span-4">
          Bring the files you already have.
        </p>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          {fileTypes.map(({ label, icon: Icon }, index) => (
            <li
              key={label}
              className="flex items-center gap-2.5 border-t border-border/70 pt-2.5 text-sm text-muted-foreground"
            >
              <span className="font-mono text-[0.64rem] text-highlight">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
