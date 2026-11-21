"use client";

import { cn } from "cn";
import {
  ChevronsUpDownIcon,
  Loader2Icon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { initialsForName } from "@/components/shell/account-chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function AccountMenu({
  name,
  variant = "full",
  side = "top",
  align = "start",
  isAdmin = false,
}: {
  name: string;
  variant?: "full" | "compact";
  side?: "top" | "bottom";
  align?: "start" | "end";
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const isCompact = variant === "compact";

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`${initialsForName(name)}${name} — account menu`}
        title={isCompact ? name : undefined}
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-[2px] text-left outline-none transition-colors hover:text-highlight focus-visible:ring-2 focus-visible:ring-ring/40",
          isCompact
            ? "size-9 justify-center"
            : "w-full min-w-0 justify-between",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center border border-border bg-surface font-mono text-[0.62rem] font-medium text-foreground"
          >
            {initialsForName(name) || "T"}
          </span>
          {isCompact ? (
            <span className="sr-only">{name}</span>
          ) : (
            <span className="truncate text-sm font-medium">{name}</span>
          )}
        </span>
        {isCompact ? null : (
          <ChevronsUpDownIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} align={align}>
        <p className="px-2 pt-1 font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">
          Signed in as
        </p>
        <p className="truncate px-2 pt-0.5 pb-1 text-sm font-medium">{name}</p>

        <DropdownMenuSeparator />

        <p className="px-2 pt-1 pb-1 font-mono text-[0.58rem] tracking-[0.08em] text-muted-foreground uppercase">
          Theme
        </p>
        <DropdownMenuRadioGroup
          value={mounted ? theme : undefined}
          onValueChange={(value) => setTheme(String(value))}
        >
          {THEMES.map((option) => {
            const Icon = option.icon;

            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon aria-hidden="true" />
                <span className="flex-1">{option.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <SettingsIcon aria-hidden="true" />
          Settings
        </DropdownMenuItem>

        {isAdmin ? (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldCheckIcon aria-hidden="true" />
            Operations
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          variant="destructive"
          closeOnClick={false}
          disabled={pending}
          onClick={() => void handleSignOut()}
        >
          {pending ? (
            <Loader2Icon aria-hidden="true" className="animate-spin" />
          ) : (
            <LogOutIcon aria-hidden="true" />
          )}
          {pending ? "Signing out…" : "Log out"}
        </DropdownMenuItem>

        {error ? (
          <p role="alert" className="px-2 pt-1 pb-1.5 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
