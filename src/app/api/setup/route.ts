import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DATABASE_PATH,
  DEFAULT_PORT,
  ensureProgramDataDirectories,
  writeAppConfig,
} from "@/lib/config-adapter";

export async function POST(request: Request) {
  try {
    let userCount = 0;
    try {
      userCount = await prisma.user.count();
    } catch {
      userCount = 0;
    }
    if (userCount > 0) {
      const session = await auth();
      if (session?.user?.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Initial setup has already been completed." },
          { status: 403 }
        );
      }
    }
    const body = (await request.json()) as {
      port?: number;
      r2?: {
        accountId?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
        bucketName?: string;
      };
    };
    ensureProgramDataDirectories();
    const config = writeAppConfig({
      port: body.port || DEFAULT_PORT,
      databaseUrl: `file:${DATABASE_PATH}`,
      ...(body.r2 ? { r2: body.r2 } : {}),
    });
    return NextResponse.json({
      ok: true,
      port: config.port,
      dataDir: config.dataDir,
      uploadsDir: config.uploadsDir,
      message: "PNP CRM distribution configuration saved.",
    });
  } catch (error) {
    console.error("[SETUP_CONFIG_ERROR]", error);
    return NextResponse.json(
      { error: "Unable to save application configuration." },
      { status: 400 }
    );
  }
}
