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

        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken as string }
        });

        if (!dbSession || new Date() > dbSession.expires) {
          return null as any; 
        }

        // Update last active
        await prisma.session.update({
          where: { id: dbSession.id },
          data: { lastActive: new Date() }
        });
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});
