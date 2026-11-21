"use client";

import { cn } from "cn";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  alwaysShowLabel = false,
  tone = "neutral",
}: {
  alwaysShowLabel?: boolean;
  tone?: "neutral" | "destructive";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignOut() {
    setPending(true);
    setError(undefined);

    const { error: signOutError } = await authClient.signOut();

    if (signOutError) {
      setError("Could not sign out. Try again.");
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <p role="alert" className="hidden text-xs text-destructive sm:block">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant={tone === "destructive" ? "destructive" : "ghost"}
        size="sm"
        onClick={handleSignOut}
        disabled={pending}
        className={cn(
          "gap-1.5",
          tone === "neutral" && "text-muted-foreground hover:text-foreground",
        )}
      >
        {pending ? (
          <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
        ) : (
          <LogOutIcon aria-hidden="true" className="size-3.5" />
        )}
        <span className={cn(!alwaysShowLabel && "hidden sm:inline")}>
          Sign out
        </span>
        {alwaysShowLabel ? null : (
          <span className="sr-only sm:hidden">Sign out</span>
        )}
      </Button>
    </div>
  );
}
