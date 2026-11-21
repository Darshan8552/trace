"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/account/schemas";

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  function reset() {
    setConfirming(false);
    setConfirmation("");
    setPassword("");
    setError(undefined);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          confirmation,
          password: password || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Your account could not be deleted.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Your account could not be deleted.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">
          Deleting your account removes every notebook, source, message, and
          uploaded file. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          aria-describedby={error ? "delete-account-error" : undefined}
          onClick={() => {
            setError(undefined);
            setConfirming(true);
          }}
        >
          <Trash2Icon aria-hidden="true" className="size-3.5" />
          Delete account
        </Button>
        {error ? (
          <p
            id="delete-account-error"
            role="alert"
            className="text-xs leading-5 text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm leading-6 text-destructive">
        This permanently deletes your workspace and every file in it. There is
        no recovery.
      </p>

      <div>
        <Label htmlFor="delete-confirmation">
          Type {DELETE_ACCOUNT_CONFIRMATION} to confirm
        </Label>
        <Input
          id="delete-confirmation"
          name="confirmation"
          autoComplete="off"
          value={confirmation}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "delete-form-error" : undefined}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={DELETE_ACCOUNT_CONFIRMATION}
          className="mt-2 h-10 font-mono"
          disabled={pending}
        />
      </div>

      {hasPassword ? (
        <div>
          <Label htmlFor="delete-password">Current password</Label>
          <PasswordField
            id="delete-password"
            name="delete-password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "delete-form-error" : undefined}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
            disabled={pending}
          />
        </div>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          This account signs in with Google. No password is needed.
        </p>
      )}

      {error ? (
        <p
          id="delete-form-error"
          role="alert"
          className="text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={
            pending || confirmation.trim() !== DELETE_ACCOUNT_CONFIRMATION
          }
        >
          {pending ? (
            <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Trash2Icon aria-hidden="true" className="size-3.5" />
          )}
          Permanently delete
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={reset}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
