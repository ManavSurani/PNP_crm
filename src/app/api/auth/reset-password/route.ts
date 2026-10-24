import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createResetToken, consumeResetToken, pruneExpiredTokens } from "@/lib/reset-tokens";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { action, phone, password, email, resetToken } = await req.json();

  // Extract IP for rate limiting
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

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

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: check both IP and Email
    const ipLimit = checkRateLimit(`reset_ip_${clientIp}`);
    if (!ipLimit.allowed) {
      const minutes = Math.ceil((ipLimit.retryAfterMs ?? 0) / 60000);
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${minutes} minutes.` },
        { status: 429 }
      );
    }

    const emailLimit = checkRateLimit(`reset_email_${normalizedEmail}`);
    if (!emailLimit.allowed) {
      const minutes = Math.ceil((emailLimit.retryAfterMs ?? 0) / 60000);
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${minutes} minutes.` },
        { status: 429 }
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

    const isPhoneMatch = normalizedInput === normalizedSetting;
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Make non-existent email indistinguishable from wrong phone to prevent account enumeration
    if (!isPhoneMatch || !user) {
      return NextResponse.json(
        { error: "Invalid email or recovery phone number" },
        { status: 400 }
      );
    }

    // Issue a short-lived one-time token stored in DB
    const token = await createResetToken(normalizedEmail);

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

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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

    // Clear rate limits upon successful recovery
    clearRateLimit(`reset_ip_${clientIp}`);
    clearRateLimit(`reset_email_${tokenEmail.toLowerCase().trim()}`);

    return NextResponse.json({ message: "Password updated successfully" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
