import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormSkeleton } from "@/components/auth/form-skeleton";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isGoogleAuthEnabled } from "@/lib/env";

export default function SignInPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Welcome back"
        title="Pick up the thread."
        description="Sign in to your workspace and keep asking."
      />
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <SignInForm googleEnabled={isGoogleAuthEnabled()} />
      </Suspense>
    </>
  );
}
