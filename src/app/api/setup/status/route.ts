import fs from "node:fs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  CONFIG_PATH,
  DATABASE_PATH,
  isConfigured,
  loadAppConfig,
} from "@/lib/config-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch {
    userCount = 0;
  }
  if (userCount > 0) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Setup is restricted." }, { status: 403 });
    }
  }
  const config = loadAppConfig();
  return NextResponse.json({
    configured: isConfigured(),
    configFile: fs.existsSync(CONFIG_PATH),
    databaseFile: fs.existsSync(DATABASE_PATH),
    port: config.port,
    dataDir: config.dataDir,
    uploadsDir: config.uploadsDir,
  });
}
