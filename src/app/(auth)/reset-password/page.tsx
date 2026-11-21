import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password — Trace",
};

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Account recovery"
        title="Choose a new password."
        description="Enter the code we emailed you, then pick a password you have not used before."
      />
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
