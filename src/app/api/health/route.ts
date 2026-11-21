import { NextResponse } from "next/server";
import { logError } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export async function GET() {
  let database = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (error) {
    logError("health.database", error);
  }

  let storage = false;

  try {
    storage = getStorage().isConfigured();
  } catch (error) {
    logError("health.storage", error);
  }

  const healthy = database;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database: database ? "up" : "down",
      storage: storage ? "configured" : "unconfigured",
      time: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
