import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  // We match everything including /login so that the 'authorized' callback 
  // can detect 'ghost' sessions and decide whether to redirect or allow.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$).*)"],
};
