import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { randomUUID } from "crypto";

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
          return null;
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

        let dbSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken as string }
        });

        // AUTO-REPAIR: If DB session is missing (e.g. DB reset) but JWT is valid, re-create DB session
        if (!dbSession) {
          console.log(`[Auth] ⚠️ Session record missing for ${token.email}. Attempting auto-repair...`);
          
          try {
            // Check if user still exists before repairing
            const userExists = await prisma.user.findUnique({ where: { id: token.id as string } });
            if (!userExists) {
              console.error("[Auth] ❌ Auto-repair failed: User no longer exists.");
              return null as any;
            }

            const settings = await prisma.systemSetting.findUnique({ where: { id: "global" } });
            const maxAge = settings?.sessionMaxAge || 30 * 24 * 60 * 60;
            
            dbSession = await prisma.session.create({
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
            // If we can't repair, we MUST return null to break any potential loops
            return null as any;
          }
        }

        if (dbSession && new Date() > dbSession.expires) {
          console.log("[Auth] ⌛ Session expired. Redirecting to login.");
          return null as any; 
        }

        // Update last active if session is healthy
        if (dbSession) {
          await prisma.session.update({
            where: { id: dbSession.id },
            data: { lastActive: new Date() }
          }).catch(err => console.error("[Auth] Failed to update lastActive:", err));
        }
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.AUTH_SECRET,
});
