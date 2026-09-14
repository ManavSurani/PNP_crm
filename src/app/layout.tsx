import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider, type ThemeConfig, DEFAULT_THEME_CONFIG } from "@/components/providers/ThemeProvider";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PNP CRM",
  description: "Furniture Business Management System",
};

async function getServerThemeConfig(): Promise<{ config: ThemeConfig; isDark: boolean }> {
  let themeConfig: ThemeConfig = DEFAULT_THEME_CONFIG;

  try {
    // 1. Try Cookie first (fastest, client-specific)
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get("pnp_crm_theme_config")?.value;
    if (cookieVal) {
      const parsed = JSON.parse(decodeURIComponent(cookieVal));
      if (parsed && typeof parsed === "object") {
        themeConfig = {
          ...DEFAULT_THEME_CONFIG,
          ...parsed,
          shortcutKey: parsed.shortcutKey || DEFAULT_THEME_CONFIG.shortcutKey,
          schedule: {
            ...DEFAULT_THEME_CONFIG.schedule,
            ...(parsed.schedule || {}),
            enabled: typeof parsed.schedule?.enabled === "boolean"
              ? parsed.schedule.enabled
              : DEFAULT_THEME_CONFIG.schedule.enabled,
          },
        };
      }
    } else {
      // 2. Fallback to Database SystemSetting.themeConfig
      const systemSetting = await prisma.systemSetting.findUnique({
        where: { id: "global" },
      }).catch(() => null);

      if (systemSetting?.themeConfig) {
        const parsed = JSON.parse(systemSetting.themeConfig);
        if (parsed && typeof parsed === "object") {
          themeConfig = {
            ...DEFAULT_THEME_CONFIG,
            ...parsed,
            shortcutKey: parsed.shortcutKey || DEFAULT_THEME_CONFIG.shortcutKey,
            schedule: {
              ...DEFAULT_THEME_CONFIG.schedule,
              ...(parsed.schedule || {}),
              enabled: typeof parsed.schedule?.enabled === "boolean"
                ? parsed.schedule.enabled
                : DEFAULT_THEME_CONFIG.schedule.enabled,
            },
          };
        }
      }
    }
  } catch (err) {
    // Graceful fallback to default
  }

  const isDark = themeConfig.mode === "dark";
  return { config: themeConfig, isDark };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config: initialConfig, isDark } = await getServerThemeConfig();

  return (
    <html lang="en" className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('pnp_crm_theme_config');
                  if (!raw) {
                    var match = document.cookie.match(/(^|;\\s*)pnp_crm_theme_config=([^;]*)/);
                    if (match) raw = decodeURIComponent(match[2]);
                  }
                  var config = raw ? JSON.parse(raw) : null;
                  var isDark = false;
                  if (config) {
                    if (config.mode === 'dark') {
                      isDark = true;
                    } else if (config.mode === 'light') {
                      isDark = false;
                    } else if (config.mode === 'system') {
                      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    } else if (config.mode === 'scheduled') {
                      if (config.schedule && config.schedule.enabled === true) {
                        var now = new Date();
                        var cur = now.getHours() * 60 + now.getMinutes();
                        var parseM = function(t) {
                          if (!t) return 0;
                          var parts = t.split(':');
                          return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
                        };
                        var dayM = parseM(config.schedule.dayTime || '07:00');
                        var nightM = parseM(config.schedule.nightTime || '19:00');
                        if (nightM > dayM) {
                          isDark = cur >= nightM || cur < dayM;
                        } else {
                          isDark = cur >= nightM && cur < dayM;
                        }
                      } else {
                        isDark = false;
                      }
                    }
                  } else {
                    isDark = false;
                  }
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider initialConfig={initialConfig}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
