"use client";

import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type SessionItem = {
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function describeDevice(userAgent?: string | null): string {
  if (!userAgent) {
    return "Unknown device";
  }

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  const platform = /Windows/.test(userAgent)
    ? "Windows"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "an unknown platform";

  return `${browser} on ${platform}`;
}

function formatWhen(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}

export function SessionList({ currentToken }: { currentToken: string }) {
  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingAll, setPendingAll] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setError(undefined);

    try {
      const { data, error: loadError } = await authClient.listSessions();

      if (loadError) {
        setError(loadError.message ?? "Could not load your devices.");
        return;
      }

      setSessions(data ?? []);
    } catch {
      setError("Could not load your devices.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(token: string) {
    setPendingToken(token);
    setError(undefined);

    try {
      const { error: revokeError } = await authClient.revokeSession({ token });

      if (revokeError) {
        setError(revokeError.message ?? "That device could not be signed out.");
        return;
      }

      await load();
    } catch {
      setError("That device could not be signed out.");
    } finally {
      setPendingToken(null);
    }
  }

  async function revokeOthers() {
    setPendingAll(true);
    setError(undefined);

    try {
      const { error: revokeError } = await authClient.revokeOtherSessions();

      if (revokeError) {
        setError(
          revokeError.message ?? "Those devices could not be signed out.",
        );
        return;
      }

      await load();
    } catch {
      setError("Those devices could not be signed out.");
    } finally {
      setPendingAll(false);
    }
  }

  if (!sessions) {
    return (
      <div className="space-y-2">
        <div className="h-14 animate-pulse rounded-[3px] border border-border bg-surface/50" />
        <div className="h-14 animate-pulse rounded-[3px] border border-border bg-surface/50" />
      </div>
    );
  }

  const otherCount = sessions.filter(
    (session) => session.token !== currentToken,
  ).length;
  const sorted = [...sessions].sort((left, right) => {
    if (left.token === currentToken) {
      return -1;
    }

    if (right.token === currentToken) {
      return 1;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border/70 overflow-hidden rounded-[3px] border border-border bg-surface/50">
        {sorted.map((session) => {
          const isCurrent = session.token === currentToken;
          const isRevoking = pendingToken === session.token;

          return (
            <li
              key={session.token}
              className="flex items-start justify-between gap-3 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">
                    {describeDevice(session.userAgent)}
                  </p>
                  {isCurrent ? (
                    <span className="border border-border px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground uppercase">
                      This device
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">
                  Last active {formatWhen(session.updatedAt)}
                  {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                </p>
              </div>

              {isCurrent ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isRevoking || pendingAll}
                  onClick={() => void revoke(session.token)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {isRevoking ? (
                    <Loader2Icon
                      aria-hidden="true"
                      className="size-3.5 animate-spin"
                    />
                  ) : null}
                  Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={otherCount === 0 || pendingAll}
          onClick={() => void revokeOthers()}
        >
          {pendingAll ? (
            <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
          ) : null}
          Sign out other devices
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void load()}
          disabled={pendingAll || pendingToken !== null}
          className="text-muted-foreground"
        >
          <RefreshCwIcon aria-hidden="true" className="size-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
