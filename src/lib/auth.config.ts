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
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardPage = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/leads") || nextUrl.pathname.startsWith("/customers") || nextUrl.pathname.startsWith("/quotations"); // Add more paths as needed or use a catch-all
      
      // If the user is on the dashboard, they MUST be logged in
      if (!isDashboardPage) return true; // Allow landing pages/login/etc
      
      return isLoggedIn; // NextAuth handles redirect to 'signIn' page automatically if false
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
