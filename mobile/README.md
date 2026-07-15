# PNP CRM — Mobile App

This folder contains the Android mobile app for PNP CRM, built with Capacitor.

## 🔒 Important Rule
**Do NOT modify any files in the parent `../src/` or `../prisma/` folders.**
All mobile-specific code lives exclusively in this `mobile/` folder.

---

## 📁 Folder Structure

```
mobile/
├── capacitor.config.ts     ← Capacitor configuration (app ID, server URL)
├── package.json            ← Mobile app dependencies
├── tsconfig.json           ← TypeScript config
├── .env                    ← Mobile environment variables
├── assets/
│   └── logo.png            ← PNP CRM logo (copied from ../public/)
├── android/                ← Auto-generated Android project (DO NOT edit manually)
│   └── app/build/outputs/apk/  ← Final .apk file lives here after build
├── src/
│   └── styles/
│       └── mobile.css      ← Design tokens (mirrors main CRM colors)
└── sync/
    ├── sync-engine.ts      ← Packages and sends local data to CRM server
    └── conflict-resolver.ts ← Prevents data loss and duplicate handling
```

---

## 🚀 Quick Start

### Step 1 — Set up Cloudflare Tunnel on your PC
While your CRM is running, open a new terminal and run:
```bash
cloudflared tunnel --url http://localhost:3000
```
Copy the URL it gives you (e.g. `https://abc123.trycloudflare.com`).

### Step 2 — Update environment variable
Edit `mobile/.env` and set:
```
NEXT_PUBLIC_CRM_TUNNEL_URL=https://abc123.trycloudflare.com
```

### Step 3 — Open in Android Studio
```bash
npx cap open android
```

### Step 4 — Build APK
In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔑 Sync API Key
The mobile app authenticates to your CRM using a secret key.
- Mobile `.env`: `NEXT_PUBLIC_MOBILE_SYNC_SECRET=PNP_MOBILE_SYNC_SECRET_2026_SECURE_V1`
- CRM `.env`: `MOBILE_SYNC_SECRET=PNP_MOBILE_SYNC_SECRET_2026_SECURE_V1`

Both must match exactly.
