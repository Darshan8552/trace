"use client";

import { cn } from "cn";
import {
  Loader2Icon,
  ShieldCheckIcon,
  ShieldIcon,
  Trash2Icon,
  Undo2Icon,
  UserXIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/admin/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

type PendingAction = "role" | "ban" | "unban" | "delete";

export function UserList({
  users,
  currentUserId,
  canManage,
}: {
  users: AdminUser[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<string>();
  const [banTarget, setBanTarget] = useState<string>();
  const [banReason, setBanReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string>();

  async function run(
    userId: string,
    action: PendingAction,
    request: () => Promise<Response>,
  ) {
    setPending(`${userId}:${action}`);
    setError(undefined);

    try {
      const response = await request();

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(payload?.error ?? "The action could not be completed.");
      }

      setBanTarget(undefined);
      setBanReason("");
      setDeleteTarget(undefined);
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The action could not be completed.",
      );
    } finally {
      setPending(undefined);
    }
  }

  function updateUser(
    userId: string,
    action: Exclude<PendingAction, "delete">,
    body: { role?: "admin" | "user"; banned?: boolean; banReason?: string },
  ) {
    return run(userId, action, () =>
      fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  }

  function deleteUser(userId: string) {
    return run(userId, "delete", () =>
      fetch(`/api/admin/users/${userId}`, { method: "DELETE" }),
    );
  }

  if (users.length === 0) {
    return (
      <p className="border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
        No accounts match. Users appear here after they sign up.
      </p>
    );
  }

  return (
    <div>
      {!canManage ? (
        <p className="mb-4 border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
          This account is allowlisted through <code>ADMIN_EMAILS</code> but has
          no admin role, so user management is read only. Run{" "}
          <code>pnpm admin:grant &lt;email&gt;</code> to grant the role.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-border border-y border-border">
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isAdmin = user.role === "admin";
          const rolePending = pending === `${user.id}:role`;
          const banPending =
            pending === `${user.id}:ban` || pending === `${user.id}:unban`;
          const deletePending = pending === `${user.id}:delete`;
          const busy = Boolean(pending);

          return (
            <li key={user.id} className="py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.name || "Unnamed"}
                    {isSelf ? (
                      <span className="ml-2 font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground uppercase">
                        you
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[0.62rem] text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.58rem] text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 border px-1.5 py-0.5 tracking-[0.06em] uppercase",
                        isAdmin
                          ? "border-foreground/30 text-foreground"
                          : "border-border",
                      )}
                    >
                      {isAdmin ? (
                        <ShieldCheckIcon
                          aria-hidden="true"
                          className="size-3"
                        />
                      ) : null}
                      {user.role}
                    </span>
                    {user.banned ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <UserXIcon aria-hidden="true" className="size-3" />
                        Banned
                        {user.banReason ? `: ${user.banReason}` : ""}
                      </span>
                    ) : null}
                    {!user.emailVerified ? <span>Email unverified</span> : null}
                    <span>
                      {user.sessionCount}{" "}
                      {user.sessionCount === 1 ? "session" : "sessions"}
                    </span>
                    <span>
                      {user.chatCount}{" "}
                      {user.chatCount === 1 ? "notebook" : "notebooks"}
                    </span>
                    <span>
                      joined {dateFormatter.format(new Date(user.createdAt))}
                    </span>
                  </div>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {isSelf ? (
                      <span className="font-mono text-[0.6rem] text-muted-foreground">
                        Self-service is blocked
                      </span>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void updateUser(user.id, "role", {
                              role: isAdmin ? "user" : "admin",
                            })
                          }
                        >
                          {rolePending ? (
                            <Loader2Icon
                              aria-hidden="true"
                              className="animate-spin"
                            />
                          ) : isAdmin ? (
                            <ShieldIcon aria-hidden="true" />
                          ) : (
                            <ShieldCheckIcon aria-hidden="true" />
                          )}
                          {rolePending
                            ? "Saving"
                            : isAdmin
                              ? "Demote"
                              : "Promote"}
                        </Button>

                        {user.banned ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void updateUser(user.id, "unban", {
                                banned: false,
                              })
                            }
                          >
                            {banPending ? (
                              <Loader2Icon
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <Undo2Icon aria-hidden="true" />
                            )}
                            {banPending ? "Saving" : "Unban"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setBanTarget(
                                banTarget === user.id ? undefined : user.id,
                              );
                              setDeleteTarget(undefined);
                            }}
                          >
                            <UserXIcon aria-hidden="true" />
                            Ban
                          </Button>
                        )}

                        {deleteTarget === user.id ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => void deleteUser(user.id)}
                          >
                            {deletePending ? (
                              <Loader2Icon
                                aria-hidden="true"
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2Icon aria-hidden="true" />
                            )}
                            {deletePending ? "Deleting" : "Confirm delete"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => {
                              setDeleteTarget(user.id);
                              setBanTarget(undefined);
                            }}
                          >
                            <Trash2Icon aria-hidden="true" />
                            Delete
                          </Button>
                        )}

                        {deleteTarget === user.id ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setDeleteTarget(undefined)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {canManage && banTarget === user.id && !user.banned ? (
                <form
                  className="mt-3 flex flex-col gap-2 border-l-2 border-highlight/60 pl-3 sm:flex-row sm:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void updateUser(user.id, "ban", {
                      banned: true,
                      banReason: banReason.trim() || undefined,
                    });
                  }}
                >
                  <label
                    htmlFor={`ban-reason-${user.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground uppercase">
                      Ban reason (optional)
                    </span>
                    <Input
                      id={`ban-reason-${user.id}`}
                      value={banReason}
                      maxLength={200}
                      onChange={(event) => setBanReason(event.target.value)}
                      placeholder="Why is this account blocked?"
                      className="mt-1"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="destructive">
                      Ban user
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBanTarget(undefined);
                        setBanReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
