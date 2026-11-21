"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FieldError, FormError } from "@/components/auth/form-message";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/auth-schemas";
import { safeNextPath } from "@/lib/redirects";

type FieldName = "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const passwordReset = searchParams.get("reset") === "1";
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  function update(field: FieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = signInSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);

    try {
      const { error } = await authClient.signIn.email({
        ...parsed.data,
        callbackURL: next,
      });

      if (error) {
        if (error.status === 403) {
          router.push(
            `/verify?email=${encodeURIComponent(parsed.data.email)}&next=${encodeURIComponent(next)}`,
          );
          return;
        }

        setFormError(error.message ?? "Could not sign you in. Try again.");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {passwordReset ? (
        <output className="mb-5 block rounded-md border border-border bg-surface px-3 py-2 text-sm leading-5 text-primary">
          Your password was updated. Sign in with the new one.
        </output>
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {googleEnabled ? (
          <>
            <GoogleButton label="Sign in with Google" callbackURL={next} />
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="mt-2 h-10"
            disabled={pending}
          />
          <FieldError id="email-error">{errors.email}</FieldError>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="mt-2"
            disabled={pending}
          />
          <FieldError id="password-error">{errors.password}</FieldError>
        </div>

        <FormError>{formError}</FormError>

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        New to Trace?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
