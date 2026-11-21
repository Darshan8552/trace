import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { VerifyForm } from "@/components/auth/verify-form";

function VerifyFallback() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-[4.25rem] rounded-md border border-border bg-secondary/60" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder row
            key={index}
            className="h-12 rounded-md border border-border bg-secondary/40"
          />
        ))}
      </div>
      <div className="h-10 rounded-lg bg-secondary/60" />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      <AuthHeading
        eyebrow="One more step"
        title="Check your inbox."
        description="Enter the 6-digit code we just emailed you. It expires in 10 minutes."
      />
      <Suspense fallback={<VerifyFallback />}>
        <VerifyForm />
      </Suspense>
    </>
  );
}
