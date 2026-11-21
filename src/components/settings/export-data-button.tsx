import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function ExportDataButton() {
  return (
    <div className="space-y-3">
      <a
        href="/api/account/export"
        download
        className={buttonVariants({
          variant: "outline",
          className: "h-9 px-3",
        })}
      >
        <DownloadIcon aria-hidden="true" className="size-3.5" />
        Download my data
      </a>
      <p className="text-xs leading-5 text-muted-foreground">
        A JSON file with your profile, notebooks, messages, and source metadata.
        Uploaded files stay available from each notebook.
      </p>
    </div>
  );
}
