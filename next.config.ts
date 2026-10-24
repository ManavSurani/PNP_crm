import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com *.google.com *.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://maps.googleapis.com http://127.0.0.1:4040 https://*.ngrok-free.dev https://*.trycloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  // Content Security Policy
  { key: "Content-Security-Policy", value: cspHeader },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer info
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed in CRM
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // XSS protection for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // HSTS (HTTPS only — safe for production)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
