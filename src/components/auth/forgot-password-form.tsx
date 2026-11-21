"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldError, FormError } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/auth-schemas";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(undefined);
    setFormError(undefined);

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter your email.");
      return;
    }

    setPending(true);

    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email: parsed.data.email,
      });

      if (error) {
        setFormError(
          error.message ?? "Could not send a reset code. Try again shortly.",
        );
        return;
      }

      router.push(
        `/reset-password?email=${encodeURIComponent(parsed.data.email)}`,
      );
    } catch {
      setFormError("Could not send a reset code. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError(undefined);
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "email-error" : undefined}
            className="mt-2 h-10"
            disabled={pending}
          />
          <FieldError id="email-error">{fieldError}</FieldError>
        </div>

        <FormError>{formError}</FormError>

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send reset code"
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/signin"
          className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
