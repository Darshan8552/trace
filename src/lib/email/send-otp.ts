import { sendEmail } from "@/lib/email/client";
import { renderOtpEmail } from "@/lib/email/templates/otp";

export const OTP_EXPIRES_IN_SECONDS = 600;

export type OtpType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const subjects: Record<OtpType, string> = {
  "email-verification": "Your Trace verification code",
  "sign-in": "Your Trace sign-in code",
  "forget-password": "Reset your Trace password",
  "change-email": "Confirm your new Trace email",
};

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: OtpType;
}): Promise<void> {
  const { html, textContent } = renderOtpEmail({
    otp,
    expiresInMinutes: OTP_EXPIRES_IN_SECONDS / 60,
  });

  await sendEmail({
    to: email,
    subject: subjects[type],
    htmlContent: html,
    textContent,
  });
}
