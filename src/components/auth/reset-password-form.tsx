"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldError, FormError } from "@/components/auth/form-message";
import { OtpField } from "@/components/auth/otp-field";
import { PasswordField } from "@/components/auth/password-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth-schemas";

const RESEND_COOLDOWN_SECONDS = 60;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  const [otp, setOtp] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    otp?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [cooldown]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(undefined);
    setNotice(undefined);

    const parsed = resetPasswordSchema.safeParse({
      email,
      otp,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const nextErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === "otp" ||
          field === "password" ||
          field === "confirmPassword"
        ) {
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setPending(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email: parsed.data.email,
        otp: parsed.data.otp,
        password: parsed.data.password,
      });

      if (error) {
        setOtp("");
        setOtpKey((key) => key + 1);
        setFormError(
          error.message ??
            "That code did not work. Request a new one and try again.",
        );
        return;
      }

      router.replace("/signin?reset=1");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setFormError(undefined);
    setNotice(undefined);

    try {
      const { error } = await authClient.emailOtp.requestPasswordReset({
        email,
      });

      if (error) {
        setFormError(
          error.message ?? "Could not send a new code. Try again shortly.",
        );
        return;
      }

      setOtp("");
      setOtpKey((key) => key + 1);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setNotice("A new code is on its way.");
    } catch {
      setFormError("Could not send a new code. Try again shortly.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="space-y-5">
        <FormError>We could not tell which email to reset.</FormError>
        <Link
          href="/forgot-password"
          className={buttonVariants({ className: "h-10 w-full" })}
        >
          Start again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[3px] border border-border bg-surface px-4 py-3">
        <p className="font-mono text-[0.64rem] text-muted-foreground">
          Reset code sent to
        </p>
        <p className="mt-1 truncate text-sm font-medium">{email}</p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">Verification code</p>
          <OtpField
            key={otpKey}
            onChange={(value) => {
              setOtp(value);
              setErrors((current) => ({ ...current, otp: undefined }));
            }}
            disabled={pending}
            invalid={Boolean(errors.otp)}
            describedBy={errors.otp ? "otp-error" : undefined}
          />
          <FieldError id="otp-error">{errors.otp}</FieldError>
        </div>

        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordField
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({ ...current, password: undefined }));
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="mt-2"
            disabled={pending}
          />
          <FieldError id="password-error">{errors.password}</FieldError>
        </div>

        <div>
          <Label htmlFor="confirm-password">Repeat new password</Label>
          <PasswordField
            id="confirm-password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            className="mt-2"
            disabled={pending}
          />
          <FieldError id="confirm-password-error">
            {errors.confirmPassword}
          </FieldError>
        </div>

        <FormError>{formError}</FormError>

        {notice && !formError ? (
          <output className="text-sm leading-5 text-primary">{notice}</output>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Set new password"
          )}
        </Button>
      </form>

      <div className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Didn&rsquo;t get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none transition-colors hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:text-muted-foreground disabled:no-underline"
          >
            {resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
        </p>
        <p>
          Wrong email?{" "}
          <Link
            href="/forgot-password"
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
