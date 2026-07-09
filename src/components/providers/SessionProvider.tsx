"use client";

import { SessionProvider as NextAuthSessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Ensures that if a window is closed and reopened, 
 * the user is forced to log in again.
 */
function SessionSecurityHandler() {
  const { status } = useSession();
  const pathname = usePathname();
  const hasChecked = useRef(false);

  useEffect(() => {
    // 1. Wait for session to load
    if (status === "loading") return;
    
    // Handle unauthenticated state (e.g., session expired while active)
    if (status === "unauthenticated" && pathname !== "/login") {
      console.log("[Auth] Session expired or invalid. Enforcing logout...");
      hasChecked.current = true;
      signOut({ redirect: false }).then(() => {
        window.location.href = "/login";
      });
      return;
    }

    // 2. Only perform the "fresh window" check once per window lifecycle
    if (hasChecked.current) return;

    const isWindowSessionActive = sessionStorage.getItem("pnp_crm_session_active");

    // 3. If we are on the login page, this window is now "initialized"
    if (pathname === "/login") {
      sessionStorage.setItem("pnp_crm_session_active", "true");
      hasChecked.current = true;
      return;
    }

    if (!isWindowSessionActive) {
      // 4. Fresh window + Existing Session = Forced Logout
      if (status === "authenticated") {
        console.log("[Auth] Fresh window session detected. Enforcing logout...");
        // Mark as checked so we don't call signOut multiple times while redirecting
        hasChecked.current = true; 
        signOut({ redirect: false }).then(() => {
          window.location.href = "/login";
        });
      } else {
        // 5. Fresh window + No Session = Safe to initialize
        sessionStorage.setItem("pnp_crm_session_active", "true");
        hasChecked.current = true;
      }
    } else {
      // 6. Window already active (e.g. refresh)
      hasChecked.current = true;
    }
  }, [status, pathname]);

  return null;
}

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider refetchInterval={30} refetchOnWindowFocus={true}>
      <SessionSecurityHandler />
      {children}
    </NextAuthSessionProvider>
  );
}
