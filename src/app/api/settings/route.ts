import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
  return NextResponse.json(settings || { sessionMaxAge: 2592000, whatsappDispatchNumber: "" });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  // Update Profile
  if (data.type === "profile") {
    const { name, email, currentPassword, newPassword } = data;
    
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If changing password, verify current password
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name, email, password: hashedPassword }
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name, email }
      });
    }

    return NextResponse.json({ message: "Profile updated" });
  }

  // Update Security Settings (Global session timeout)
  if (data.type === "security") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change system-wide security settings" }, { status: 403 });
    }

    const { sessionMaxAge } = data;
    await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: { sessionMaxAge: parseInt(sessionMaxAge) },
      create: { id: "global", sessionMaxAge: parseInt(sessionMaxAge) }
    });

    return NextResponse.json({ message: "Security settings updated" });
  }

  // Update System Settings (WhatsApp Dispatch)
  if (data.type === "system") {
    const { whatsappDispatchNumber } = data;
    await prisma.systemSetting.upsert({
      where: { id: "global" },
      update: { whatsappDispatchNumber },
      create: { id: "global", whatsappDispatchNumber, sessionMaxAge: 2592000 }
    });
    return NextResponse.json({ message: "System settings updated" });
  }

  // Update Analytics Security (PIN Protection)
  if (data.type === "analytics-security") {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can change security settings" }, { status: 403 });
    }

    const { isAnalyticsPinEnabled, pin, currentPin } = data;
    const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } }) as any;

    // Case 1: Toggle protection
    if (isAnalyticsPinEnabled !== undefined) {
      await (prisma.systemSetting as any).upsert({
        where: { id: "global" },
        update: { isAnalyticsPinEnabled } as any,
        create: { id: "global", isAnalyticsPinEnabled } as any
      });
      return NextResponse.json({ message: `PIN Protection ${isAnalyticsPinEnabled ? "enabled" : "disabled"}` });
    }

    // Case 2: Set/Change PIN
    if (pin) {
      // If setting for the first time
      if (!settings?.analyticsPin) {
        const hashedPin = await bcrypt.hash(pin, 10);
        await (prisma.systemSetting as any).upsert({
          where: { id: "global" },
          update: { analyticsPin: hashedPin, isAnalyticsPinEnabled: true } as any,
          create: { id: "global", analyticsPin: hashedPin, isAnalyticsPinEnabled: true } as any
        });
        return NextResponse.json({ message: "PIN set successfully" });
      }

      // If changing existing PIN
      if (currentPin) {
        const isMatch = await bcrypt.compare(currentPin, settings.analyticsPin);
        if (!isMatch) return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 400 });
        
        const hashedPin = await bcrypt.hash(pin, 10);
        await (prisma.systemSetting as any).update({
          where: { id: "global" },
          data: { analyticsPin: hashedPin } as any
        });
        return NextResponse.json({ message: "PIN updated successfully" });
      }
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
