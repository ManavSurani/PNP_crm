/**
 * DB-backed password reset token store.
 * Uses the PasswordResetToken table in SQLite so tokens survive
 * module hot-reloads and server restarts.
 *
 * TTL: 15 minutes, single-use (deleted on consumption).
 */

import prisma from "./prisma";
import { randomBytes } from "crypto"; // Node.js built-in — always available

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Creates a reset token for the given email and stores it in the DB. Returns the token string. */
export async function createResetToken(email: string): Promise<string> {
  // Delete any existing tokens for this email first
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex"); // 64-char hex string
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt },
  });

  return token;
}

/**
 * Validates and consumes a reset token.
 * Returns the email if valid and not expired, otherwise null.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) return null;

  if (new Date() > record.expiresAt) {
    // Expired — clean up and reject
    await prisma.passwordResetToken.delete({ where: { token } });
    return null;
  }

  // Valid — consume (one-time use)
  await prisma.passwordResetToken.delete({ where: { token } });

  return record.email;
}

/** Cleanup expired tokens (call periodically or on startup) */
export async function pruneExpiredTokens(): Promise<void> {
  await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
