import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protects all routes except api, _next/static, _next/image, favicon.ico and logo.png
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|Gemini_Generated_Image_5m69l15m69l15m69.png).*)"],
};
