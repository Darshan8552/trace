"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormError } from "@/components/auth/form-message";
import { OtpField } from "@/components/auth/otp-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { otpCodeLength } from "@/lib/auth-schemas";
import { safeNextPath } from "@/lib/redirects";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const next = safeNextPath(searchParams.get("next"));

  const [otp, setOtp] = useState("");
  const [otpKey, setOtpKey] = useState(0);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const submittedRef = useRef("");

  const resetOtp = useCallback(() => {
    submittedRef.current = "";
    setOtp("");
    setOtpKey((key) => key + 1);
  }, []);

  const verify = useCallback(
    async (code: string) => {
      setPending(true);
      setError(undefined);

      try {
        const { error: verifyError } = await authClient.emailOtp.verifyEmail({
          email,
          otp: code,
        });

        if (verifyError) {
          resetOtp();
          setError(
            verifyError.message ??
              "That code did not work. Request a new one and try again.",
          );
          return;
        }

        router.replace(next);
        router.refresh();
      } catch {
        resetOtp();
        setError("Something went wrong. Try again in a moment.");
      } finally {
        setPending(false);
      }
    },
    [email, next, resetOtp, router],
  );

  useEffect(() => {
    if (otp.length !== otpCodeLength || pending) {
      return;
    }

    if (submittedRef.current === otp) {
      return;
    }

    submittedRef.current = otp;
    void verify(otp);
  }, [otp, pending, verify]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [cooldown]);

  async function handleResend() {
    setResending(true);
    setError(undefined);
    setNotice(undefined);

    try {
      const { error: resendError } =
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });

      if (resendError) {
        setError(
          resendError.message ??
            "Could not send a new code. Try again shortly.",
        );
        return;
      }

      resetOtp();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setNotice("A new code is on its way.");
    } catch {
      setError("Could not send a new code. Try again shortly.");
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="space-y-5">
        <FormError>We could not tell which email to verify.</FormError>
        <Link
          href="/signup"
          className={buttonVariants({ className: "h-10 w-full" })}
        >
          Back to sign up
        </Link>
      </div>
    );
  }

  const nextQuery = encodeURIComponent(next);

  return (
    <div className="space-y-6">
      <div className="rounded-[3px] border border-border bg-surface px-4 py-3">
        <p className="font-mono text-[0.64rem] text-muted-foreground">
          Code sent to
        </p>
        <p className="mt-1 truncate text-sm font-medium">{email}</p>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (
            otp.length === otpCodeLength &&
            !pending &&
            submittedRef.current !== otp
          ) {
            submittedRef.current = otp;
            void verify(otp);
          }
        }}
        className="space-y-5"
      >
        <OtpField
          key={otpKey}
          onChange={setOtp}
          disabled={pending}
          invalid={Boolean(error)}
          describedBy={error ? "verify-otp-error" : undefined}
        />

        {error ? <FormError id="verify-otp-error">{error}</FormError> : null}

        {notice && !error ? (
          <output className="text-sm leading-5 text-primary">{notice}</output>
        ) : null}

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify email"
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
            href={`/signup?next=${nextQuery}`}
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Start over
          </Link>
        </p>
        <p>
          Already have an account?{" "}
          <Link
            href={`/signin?next=${nextQuery}`}
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
