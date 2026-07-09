import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

// GET — Return the currently saved schedule time, last run timestamp, and enabled state
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await (prisma.systemSetting as any).findUnique({
      where: { id: "global" },
    });

    return NextResponse.json({
      isAutoBackupEnabled: settings?.isAutoBackupEnabled ?? false,
      autoBackupTime: settings?.autoBackupTime ?? null,
      autoBackupLastRun: settings?.autoBackupLastRun ?? null,
    });
  } catch (err: any) {
    console.error("[Schedule] GET DB Error:", err.message);
    // Return a graceful default so the frontend doesn't crash on 'Unexpected end of JSON input'
    return NextResponse.json({
      isAutoBackupEnabled: false,
      autoBackupTime: "23:00",
      autoBackupLastRun: null,
    });
  }
}

// POST — Save the schedule time, create the VBScript wrapper, and create the Task Scheduler task
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let time: string;
  try {
    const body = await req.json();
    time = body.time; // Expected: "HH:MM" in 24-hour format
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Invalid time format. Expected HH:MM" }, { status: 400 });
  }

  try {
    // Save chosen time and enable status to database
    await (prisma.systemSetting as any).upsert({
      where: { id: "global" },
      update: { autoBackupTime: time, isAutoBackupEnabled: true } as any,
      create: { id: "global", autoBackupTime: time, isAutoBackupEnabled: true, sessionMaxAge: 2592000 } as any,
    });
  } catch (err: any) {
    console.error("[Schedule] POST DB Error:", err.message);
    return NextResponse.json({ error: "Failed to update database schema. The database may be missing columns." }, { status: 500 });
  }

  const nodePath = process.execPath;
  const scriptPath = path.join(process.cwd(), "scripts", "auto-backup.mjs");
  const vbsPath = path.join(process.cwd(), "scripts", "run-auto-backup.vbs");
  const taskName = "PNP CRM Auto Backup";

  // Generate the VBScript to run the node script silently (0 flag hides terminal)
  const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """${nodePath}"" ""${scriptPath}""", 0, False
  `.trim();
  
  // Ensure the scripts directory exists
  if (!fs.existsSync(path.dirname(vbsPath))) {
    fs.mkdirSync(path.dirname(vbsPath), { recursive: true });
  }
  fs.writeFileSync(vbsPath, vbsContent, "utf8");

  // schtasks /f flag overwrites any existing task with the same name
  const cmd = [
    "schtasks",
    "/create",
    `/tn "${taskName}"`,
    `/tr "wscript.exe \\"${vbsPath}\\""`,
    "/sc daily",
    `/st ${time}`,
    "/f",
  ].join(" ");

  try {
    await execAsync(cmd);
    return NextResponse.json({
      success: true,
      message: `Auto-backup scheduled daily at ${time}`,
    });
  } catch (err: any) {
    console.error("[Schedule] schtasks error:", err.stderr ?? err.message);
    return NextResponse.json(
      { error: "Failed to create Task Scheduler task: " + (err.stderr ?? err.message) },
      { status: 500 }
    );
  }
}

// DELETE — Disable auto-backup and delete the Task Scheduler task
export async function DELETE() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Update DB to disabled
    await (prisma.systemSetting as any).upsert({
      where: { id: "global" },
      update: { isAutoBackupEnabled: false } as any,
      create: { id: "global", isAutoBackupEnabled: false, sessionMaxAge: 2592000 } as any,
    });
  } catch (err: any) {
    console.error("[Schedule] DELETE DB Error:", err.message);
    return NextResponse.json({ error: "Failed to update database schema. The database may be missing columns." }, { status: 500 });
  }

  const taskName = "PNP CRM Auto Backup";
  const cmd = `schtasks /delete /tn "${taskName}" /f`;

  try {
    await execAsync(cmd);
    return NextResponse.json({
      success: true,
      message: `Auto-backup disabled successfully`,
    });
  } catch (err: any) {
    const errorMsg = err.stderr ?? err.message ?? "";
    // If the task wasn't found, it's fine. We still successfully disabled it in DB.
    if (errorMsg.includes("The specified task name") || errorMsg.includes("ERROR: The system cannot find the file specified")) {
       return NextResponse.json({
          success: true,
          message: `Auto-backup disabled (task was already missing)`,
       });
    }
    
    console.error("[Schedule] schtasks delete error:", errorMsg);
    // Return success anyway since it's disabled in the DB, but log the warning.
    return NextResponse.json({
      success: true,
      message: `Auto-backup disabled, but removing the Windows task showed a warning: ${errorMsg}`,
    });
  }
}
