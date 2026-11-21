import "server-only";
import { notFound } from "next/navigation";
import { isAdminUser } from "@/lib/admin/access";
import { requireSession } from "@/lib/session";

export async function requireAdmin() {
  const session = await requireSession();

  if (!isAdminUser(session.user)) {
    notFound();
  }

  return session;
}
