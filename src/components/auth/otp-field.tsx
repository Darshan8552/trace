"use client";

import { cn } from "cn";
import { useRef, useState } from "react";
import { otpCodeLength } from "@/lib/auth-schemas";

export function OtpField({
  onChange,
  disabled,
  invalid,
  describedBy,
}: {
  onChange: (otp: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array(otpCodeLength).fill(""),
  );
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function commit(next: string[]) {
    setDigits(next);
    onChange(next.every(Boolean) ? next.join("") : "");
  }

  function focusAt(index: number) {
    const safeIndex = Math.min(Math.max(index, 0), otpCodeLength - 1);
    inputs.current[safeIndex]?.focus();
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    commit(next);

    if (digit) {
      focusAt(index + 1);
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];

      if (next[index]) {
        next[index] = "";
        commit(next);
        return;
      }

      if (index > 0) {
        next[index - 1] = "";
        commit(next);
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLFieldSetElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpCodeLength);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    const next = Array(otpCodeLength).fill("");
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    commit(next);
    focusAt(pasted.length);
  }

  return (
    <fieldset
      aria-label="6-digit verification code"
      aria-describedby={describedBy}
      className="grid grid-cols-6 gap-2 rounded-lg border border-input bg-surface p-2"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: digits are positional
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          // biome-ignore lint/a11y/noAutofocus: OTP field benefits from focusing the first box
          autoFocus={index === 0}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${otpCodeLength}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "h-12 w-full rounded-md border border-input bg-transparent text-center text-lg font-medium tabular-nums outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          )}
        />
      ))}
    </fieldset>
  );
}
