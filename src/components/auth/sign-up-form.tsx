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
import { signUpSchema } from "@/lib/auth-schemas";
import { safeNextPath } from "@/lib/redirects";

type FieldName = "name" | "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [values, setValues] = useState({ name: "", email: "", password: "" });
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

    const parsed = signUpSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "name" || field === "email" || field === "password") {
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPending(true);

    try {
      const { error } = await authClient.signUp.email({
        ...parsed.data,
        callbackURL: next,
      });

      if (error) {
        setFormError(
          error.message ?? "Could not create your account. Try again.",
        );
        return;
      }

      router.push(
        `/verify?email=${encodeURIComponent(parsed.data.email)}&next=${encodeURIComponent(next)}`,
      );
    } catch {
      setFormError("Something went wrong. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        {googleEnabled ? (
          <>
            <GoogleButton label="Sign up with Google" callbackURL={next} />
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        ) : null}

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="mt-2 h-10"
            disabled={pending}
          />
          <FieldError id="name-error">{errors.name}</FieldError>
        </div>

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
          <Label htmlFor="password">Password</Label>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : "password-hint"
            }
            className="mt-2"
            disabled={pending}
          />
          {errors.password ? (
            <FieldError id="password-error">{errors.password}</FieldError>
          ) : (
            <p
              id="password-hint"
              className="mt-1.5 text-xs leading-5 text-muted-foreground"
            >
              Use at least 8 characters.
            </p>
          )}
        </div>

        <FormError>{formError}</FormError>

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/signin?next=${encodeURIComponent(next)}`}
          className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
