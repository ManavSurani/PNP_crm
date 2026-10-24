import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { randomUUID } from "crypto";
import { checkRateLimit, clearRateLimit } from "./rate-limit";

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailStr = (credentials.email as string).toLowerCase();

        // 1. IP Rate Limiting (Network Layer)
        // Attempt to extract IP, fallback to email if running locally or headers missing
        const forwardedFor = req?.headers?.get("x-forwarded-for");
        const realIp = req?.headers?.get("x-real-ip");
        const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || emailStr);
        
        const rateLimitKey = `login_ip:${clientIp}`;
        const rateCheck = checkRateLimit(rateLimitKey);
        
        if (!rateCheck.allowed) {
          const minutes = Math.ceil((rateCheck.retryAfterMs ?? 0) / 60000);
          throw new Error(`TOO_MANY_ATTEMPTS:${minutes}`);
        }

        // 2. Database Account Lockout (Application Layer)
        const user = await prisma.user.findUnique({
          where: { email: emailStr }
        });

        if (!user) {
          return null;
        }

        // Check if user is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          const remainingMs = user.lockedUntil.getTime() - Date.now();
          const minutes = Math.ceil(remainingMs / 60000);
          throw new Error(`ACCOUNT_LOCKED:${minutes}`);
        }

        // If locked but time has passed, we will reset it upon successful login,
        // or re-increment upon failure.

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          // Increment failed attempts
          const newFailCount = user.failedLoginAttempts + 1;
          const updateData: any = { failedLoginAttempts: newFailCount };
          
          if (newFailCount >= 5) {
            // Lock for 15 minutes
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          
          await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });

          return null; // The rate limiter has also tracked this IP failure
        }

        // Successful login — clear network rate limit and DB lockout counters
        clearRateLimit(rateLimitKey);
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null }
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const sessionToken = randomUUID();
        
        // Fetch session timeout from settings
        const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
        const maxAge = settings?.sessionMaxAge || 30 * 24 * 60 * 60; // Default 30 days

        await prisma.session.create({
          data: {
            sessionToken,
            userId: user.id!,
            expires: new Date(Date.now() + maxAge * 1000),
            userAgent: "Web Browser", // In a real app, you'd get this from headers
          }
        });

        token.id = user.id;
        token.role = user.role;
        token.sessionToken = sessionToken;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.sessionToken = token.sessionToken as string;

        // Verify session still exists in DB
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken as string }
        });

        // If DB session is missing or revoked, invalidate session
        if (!dbSession) {
          console.log(`[Auth] ⚠️ Session record missing or revoked for ${token.email}. Invalidating session.`);
          return null as any;
        }

        if (new Date() > dbSession.expires) {
          console.log("[Auth] ⌛ Session expired. Redirecting to login.");
          return null as any; 
        }

        // Update last active if session is healthy
        await prisma.session.update({
          where: { id: dbSession.id },
          data: { lastActive: new Date() }
        }).catch(err => console.error("[Auth] Failed to update lastActive:", err));
      }
      return session;
    }
  },
  events: {
    async signOut(message: any) {
      const token = message && "token" in message ? message.token : null;
      if (token?.sessionToken) {
        console.log(`[Auth] 🗑️ Cleaning up session ${token.sessionToken} on sign-out.`);
        await prisma.session.delete({
          where: { sessionToken: token.sessionToken as string }
        }).catch(err => console.warn("[Auth] Failed to delete session on sign-out (likely already gone):", err));
      }
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
