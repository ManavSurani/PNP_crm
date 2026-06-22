import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig = {
  providers: [
    // We'll add the credentials provider here but without the authorize logic that uses prisma/bcrypt
    // The actual authorize logic will stay in the main auth.ts
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize() {
        return null; // This will be overridden in auth.ts
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // We do not define maxAge here to ensure it uses the browser session
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // By omitting maxAge/expires here, we force the browser to treat this as a "Session Cookie"
        // which means it gets automatically deleted the moment the user closes the app/browser.
      }
    }
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      
      // 1. If user is logged in and tries to access login page, redirect to dashboard
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true; // Allow access to login if not logged in
      }

      // 2. Protect all other pages (Dashboard)
      // If not logged in, NextAuth will automatically redirect to /login
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
} satisfies NextAuthConfig;
