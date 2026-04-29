import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protects all routes except api, _next/static, _next/image, and favicon.ico
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
