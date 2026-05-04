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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rate limit by email to prevent brute-force
        const rateLimitKey = `login:${(credentials.email as string).toLowerCase()}`;
        const rateCheck = checkRateLimit(rateLimitKey);
        if (!rateCheck.allowed) {
          const minutes = Math.ceil((rateCheck.retryAfterMs ?? 0) / 60000);
          throw new Error(`TOO_MANY_ATTEMPTS:${minutes}`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null; // rate limiter already incremented
        }

        // Successful login — clear rate limit counter
        clearRateLimit(rateLimitKey);

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

        // AUTO-REPAIR: If DB session is missing (e.g. DB reset) but JWT is valid, re-create DB session
        if (!dbSession) {
          console.log(`[Auth] ⚠️ Session record missing for ${token.email}. Attempting auto-repair...`);
          
          try {
            const userExists = await prisma.user.findUnique({ where: { id: token.id as string } });
            if (!userExists) {
              console.error("[Auth] ❌ Auto-repair failed: User no longer exists.");
              return null as any;
            }

            const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
            const maxAge = settings?.sessionMaxAge || 30 * 24 * 60 * 60;
            
            await prisma.session.create({
              data: {
                sessionToken: token.sessionToken as string,
                userId: token.id as string,
                expires: new Date(Date.now() + maxAge * 1000),
                userAgent: "Auto-Repaired Session",
              }
            });
            console.log("[Auth] ✅ Session auto-repaired successfully.");
          } catch (error) {
            console.error("[Auth] ❌ Session auto-repair critical failure:", error);
            return null as any;
          }
        } else if (new Date() > dbSession.expires) {
          console.log("[Auth] ⌛ Session expired. Redirecting to login.");
          return null as any; 
        } else {
          // Update last active if session is healthy
          await prisma.session.update({
            where: { id: dbSession.id },
            data: { lastActive: new Date() }
          }).catch(err => console.error("[Auth] Failed to update lastActive:", err));
        }
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
