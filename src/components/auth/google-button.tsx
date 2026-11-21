"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleButton({
  label,
  callbackURL = "/chat",
}: {
  label: string;
  callbackURL?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (signInError) {
      setError(
        signInError.message ?? "Could not start Google sign-in. Try again.",
      );
      setPending(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full gap-2.5"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? (
          <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        {label}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
