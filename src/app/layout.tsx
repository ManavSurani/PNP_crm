import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('pnp_crm_theme_config');
                  var config = raw ? JSON.parse(raw) : null;
                  var isDark = false;
                  if (config) {
                    if (config.mode === 'dark') isDark = true;
                    else if (config.mode === 'light') isDark = false;
                    else if (config.mode === 'system') {
                      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    } else if (config.mode === 'scheduled' && config.schedule) {
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
                    }
                  } else {
                    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
