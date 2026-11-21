"use client";

import { CheckIcon, CopyIcon, Link2Icon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ShareNotebookDialog({
  open,
  onOpenChange,
  chatId,
  slug,
  onSlugChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  slug: string | null;
  onSlugChange: (slug: string | null) => void;
}) {
  const [url, setUrl] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slug) {
      setUrl(`${window.location.origin}/s/${slug}`);
    }
  }, [slug]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  async function createLink() {
    setError(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/chats/${chatId}/share`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        slug?: string;
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.slug || !payload.url) {
        throw new Error(payload?.error ?? "The link could not be created.");
      }

      onSlugChange(payload.slug);
      setUrl(payload.url);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "The link could not be created.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function copy() {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      if (copiedTimer.current) {
        clearTimeout(copiedTimer.current);
      }

      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Clipboard access was blocked. Copy the address manually.");
    }
  }

  async function revoke() {
    setError(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/chats/${chatId}/share`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("The link could not be revoked.");
      }

      onSlugChange(null);
      setUrl("");
      setConfirming(false);
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "The link could not be revoked.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Notebook / share
          </p>
          <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
            Share this notebook
          </DialogTitle>
          <DialogDescription className="text-sm leading-6">
            Anyone with the link can read this conversation and the cited
            passages. They cannot ask questions, edit anything, or download the
            original files.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-3">
          {slug ? (
            <>
              <label
                className="font-mono text-[0.62rem] text-muted-foreground"
                htmlFor="share-url"
              >
                Share link
              </label>
              <Input
                id="share-url"
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void copy()}>
                  {copied ? (
                    <CheckIcon aria-hidden="true" data-icon="inline-start" />
                  ) : (
                    <CopyIcon aria-hidden="true" data-icon="inline-start" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>

                {confirming ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => void revoke()}
                    >
                      Revoke link
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => setConfirming(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirming(true)}
                  >
                    <Trash2Icon aria-hidden="true" data-icon="inline-start" />
                    Revoke
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button
              type="button"
              className="w-fit gap-1.5"
              disabled={isBusy}
              onClick={() => void createLink()}
            >
              <Link2Icon aria-hidden="true" className="size-4" />
              {isBusy ? "Creating…" : "Create share link"}
            </Button>
          )}

          {error ? (
            <p role="alert" className="text-xs leading-5 text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
