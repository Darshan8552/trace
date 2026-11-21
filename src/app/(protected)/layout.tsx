import { Suspense } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { isAdminUser } from "@/lib/admin/access";
import { requireSession } from "@/lib/session";

function ProtectedFallback() {
  return (
    <div className="flex min-h-dvh animate-pulse flex-col">
      <div className="h-14 border-b border-border" />
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Opening your workspace…</p>
      </div>
    </div>
  );
}

async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();

  return (
    <div className="flex h-dvh flex-col">
      <CommandPalette userName={user.name} isAdmin={isAdminUser(user)} />
      {children}
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedFallback />}>
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}
