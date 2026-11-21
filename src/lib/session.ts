import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const requireSession = cache(async () => {
  const session = await getSession();

  if (!session) {
    const requestHeaders = await headers();
    const next = requestHeaders.get("x-pathname") ?? "/chat";
    redirect(`/signin?next=${encodeURIComponent(next)}`);
  }

  return session;
});
