import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createResetToken, consumeResetToken, pruneExpiredTokens } from "@/lib/reset-tokens";

export async function POST(req: Request) {
  const { action, phone, password, email, resetToken } = await req.json();

  // Prune stale tokens on every request (lightweight housekeeping)
  await pruneExpiredTokens().catch(() => {}); // non-blocking, ignore errors

  // ── Step 1: Verify Phone Number → issue one-time DB token ───────────────
  if (action === "verify") {
    if (!phone || !email) {
      return NextResponse.json(
        { error: "Email and Phone number are required" },
        { status: 400 }
      );
    }

    // Get the global WhatsApp Dispatch Number from SystemSetting
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "global" },
    });

    if (!settings?.whatsappDispatchNumber) {
      return NextResponse.json(
        { error: "Recovery system not configured. Contact Admin." },
        { status: 400 }
      );
    }

    // Normalize and compare phone numbers
    const normalizedInput   = phone.replace(/\D/g, "");
    const normalizedSetting = settings.whatsappDispatchNumber.replace(/\D/g, "");

    if (normalizedInput !== normalizedSetting) {
      return NextResponse.json(
        { error: "Recovery phone number is incorrect" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      );
    }

    // Issue a short-lived one-time token stored in DB
    const token = await createResetToken(email);

    return NextResponse.json({ message: "Verified", resetToken: token });
  }

  // ── Step 2: Reset Password (requires valid DB-stored one-time token) ────
  if (action === "reset") {
    if (!resetToken || !password) {
      return NextResponse.json(
        { error: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Validate and consume the token from DB (one-time use, checks expiry)
    const tokenEmail = await consumeResetToken(resetToken);
    if (!tokenEmail) {
      return NextResponse.json(
        { error: "Reset link has expired or is invalid. Please start over." },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: tokenEmail },
      data: { password: hashedPassword },
    });

    // Invalidate all active sessions for this user → forces re-login on all devices
    await prisma.session.deleteMany({
      where: { user: { email: tokenEmail } },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
