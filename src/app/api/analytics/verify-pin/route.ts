import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { pin } = await req.json();
    const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } }) as any;

    if (!settings?.analyticsPin) {
      console.warn("[VERIFY_PIN] PIN not setup in DB");
      return NextResponse.json({ error: "PIN not setup" }, { status: 400 });
    }

    console.log("[VERIFY_PIN] Attempting match for PIN hash:", settings.analyticsPin);
    const isMatch = await bcrypt.compare(pin, settings.analyticsPin);
    console.log("[VERIFY_PIN] Match result:", isMatch);
    
    if (isMatch) {
      return NextResponse.json({ success: true });
    } else {
      console.log("[VERIFY_PIN] Auth failed for user:", session.user?.email);
      return NextResponse.json({ error: "Incorrect security PIN" }, { status: 400 });
    }
  } catch (error) {
    console.error("[VERIFY_PIN] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
