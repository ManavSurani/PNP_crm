import fs from "node:fs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  DATABASE_PATH,
  isConfigured,
  loadAppConfig,
} from "@/lib/config-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = loadAppConfig();
  let database = "unavailable";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch {
    database = "error";
  }

  const healthy = database === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      app: "PNP CRM",
      configured: isConfigured(),
      port: config.port,
      database,
      databaseFile: fs.existsSync(DATABASE_PATH),
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
