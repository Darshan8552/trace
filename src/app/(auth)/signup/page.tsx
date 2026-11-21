import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleAuthEnabled } from "@/lib/env";

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Create your account"
        title="Start tracing your documents."
        description="Upload a file, ask a question, and see exactly where the answer came from."
      />
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpForm googleEnabled={isGoogleAuthEnabled()} />
      </Suspense>
    </>
  );
}
