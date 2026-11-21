"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { passwordChangeSchema } from "@/lib/settings/schemas";

const EMPTY_PASSWORDS = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordForm() {
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function update(field: keyof typeof EMPTY_PASSWORDS, value: string) {
    setPasswords((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaved(false);

    const parsed = passwordChangeSchema.safeParse(passwords);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your passwords.");
      return;
    }

    setPending(true);

    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      });

      if (changeError) {
        setError(changeError.message ?? "Could not update your password.");
        return;
      }

      setPasswords(EMPTY_PASSWORDS);
      setSaved(true);
    } catch {
      setError("Could not update your password. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          name="currentPassword"
          type="password"
          value={passwords.currentPassword}
          autoComplete="current-password"
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "password-form-error" : undefined}
          onChange={(event) => update("currentPassword", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            value={passwords.newPassword}
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "password-form-error" : "password-form-hint"
            }
            onChange={(event) => update("newPassword", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            value={passwords.confirmPassword}
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? "password-form-error" : "password-form-hint"
            }
            onChange={(event) => update("confirmPassword", event.target.value)}
          />
        </div>
      </div>

      <p
        id="password-form-hint"
        className="text-xs leading-5 text-muted-foreground"
      >
        Use at least 8 characters.
      </p>

      {error ? (
        <p
          id="password-form-error"
          role="alert"
          className="text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}

      {saved && !error ? (
        <output className="block text-xs leading-5 text-primary">
          Password updated.
        </output>
      ) : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <>
            <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
            Updating
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
