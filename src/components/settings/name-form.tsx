"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { displayNameSchema } from "@/lib/settings/schemas";

export function NameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSaved(false);

    const parsed = displayNameSchema.safeParse(name);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid name.");
      return;
    }

    setPending(true);

    try {
      const { error: updateError } = await authClient.updateUser({
        name: parsed.data,
      });

      if (updateError) {
        setError(updateError.message ?? "Could not save your name.");
        return;
      }

      setName(parsed.data);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save your name. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="name"
          value={name}
          maxLength={80}
          autoComplete="name"
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "display-name-error" : "display-name-hint"}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
        <p
          id="display-name-hint"
          className="text-xs leading-5 text-muted-foreground"
        >
          Shown in the header and on your notebooks.
        </p>
      </div>

      {error ? (
        <p
          id="display-name-error"
          role="alert"
          className="text-xs leading-5 text-destructive"
        >
          {error}
        </p>
      ) : null}

      {saved && !error ? (
        <output className="block text-xs leading-5 text-primary">
          Name saved.
        </output>
      ) : null}

      <Button
        type="submit"
        size="sm"
        disabled={pending || name === initialName}
      >
        {pending ? (
          <>
            <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
            Saving
          </>
        ) : (
          "Save name"
        )}
      </Button>
    </form>
  );
}
