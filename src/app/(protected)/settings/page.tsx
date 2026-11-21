import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { ExportDataButton } from "@/components/settings/export-data-button";
import { NameForm } from "@/components/settings/name-form";
import { PasswordForm } from "@/components/settings/password-form";
import { SessionList } from "@/components/settings/session-list";
import { SettingsPageFallback } from "@/components/settings/settings-page-fallback";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Settings — Trace",
};

const joinedDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function Section({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t border-border py-8 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <div>
        <h2 className="font-mono text-[0.62rem] tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

async function SettingsContent() {
  const { user, session } = await requireSession();
  const requestHeaders = await headers();
  const accounts = await auth.api
    .listUserAccounts({ headers: requestHeaders })
    .catch(() => []);
  const hasPassword = accounts.some(
    (account) => account.providerId === "credential",
  );

  return (
    <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-16 sm:px-8 sm:pt-12">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 rounded-[2px] font-mono text-[0.62rem] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          All notebooks
        </Link>

        <p className="mt-8 font-mono text-[0.62rem] text-muted-foreground">
          Workspace / account
        </p>
        <h1 className="mt-1 font-display text-4xl leading-none tracking-[-0.02em]">
          Settings
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
          Manage how Trace identifies you, how it looks, how you sign in, and
          the data kept in this workspace.
        </p>

        <div className="mt-8">
          <Section
            label="Profile"
            description="Your name and the email tied to this workspace."
          >
            <div className="space-y-5">
              <NameForm initialName={user.name} />

              <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[0.6rem] text-muted-foreground">
                    Email
                  </dt>
                  <dd className="mt-1 flex min-w-0 items-center gap-2 text-sm">
                    <span className="truncate">{user.email}</span>
                    <span className="shrink-0 border border-border px-1 font-mono text-[0.58rem] text-muted-foreground uppercase">
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[0.6rem] text-muted-foreground">
                    Member since
                  </dt>
                  <dd className="mt-1 text-sm">
                    {joinedDateFormatter.format(new Date(user.createdAt))}
                  </dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section
            label="Appearance"
            description="Trace uses the same paper-and-ink palette in both themes."
          >
            <AppearanceForm />
          </Section>

          <Section
            label="Security"
            description="Passwords are hashed; Trace never stores them in plain text."
          >
            {hasPassword ? (
              <PasswordForm />
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                This account signs in with Google, so there is no password to
                change here.
              </p>
            )}
          </Section>

          <Section
            label="Devices"
            description="Sessions signed in to this account. Revoke any you do not recognize."
          >
            <SessionList currentToken={session.token} />
          </Section>

          <Section
            label="Your data"
            description="Take a copy of everything Trace stores for you."
          >
            <ExportDataButton />
          </Section>

          <Section
            label="Danger zone"
            description="Irreversible actions for this account."
          >
            <DeleteAccountForm hasPassword={hasPassword} />
          </Section>

          <Section
            label="This device"
            description="End this session on the current device."
          >
            <SignOutButton alwaysShowLabel tone="destructive" />
          </Section>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsContent />
    </Suspense>
  );
}
