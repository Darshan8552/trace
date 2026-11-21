import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Trace",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Account recovery"
        title="Find your way back."
        description="Enter the email tied to your workspace and we will send a 6-digit reset code."
      />
      <ForgotPasswordForm />
    </>
  );
}
