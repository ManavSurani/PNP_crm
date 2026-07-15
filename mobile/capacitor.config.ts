import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App identity
  appId: 'com.pnp.crm',
  appName: 'PNP CRM',

  // Points to the Next.js production build output
  // After `npm run build` in the root CRM folder, the static files are in `.next`
  // For Capacitor, we use a live server URL pointing to the CRM running on this PC
  webDir: '../.next',

  // When the phone has internet, use the Cloudflare Tunnel URL to load the live CRM
  // IMPORTANT: Replace this URL after running `cloudflared tunnel --url http://localhost:3000`
  server: {
    // Set this to your Cloudflare Tunnel URL once you have it
    // Example: 'https://abc123.trycloudflare.com'
    url: process.env.CLOUDFLARE_TUNNEL_URL || 'http://localhost:3000',
    cleartext: false,
    allowNavigation: [
      '*.trycloudflare.com',
      'localhost',
    ],
  },

  android: {
    // Build output folder
    buildOptions: {
      releaseType: 'APK',
    },
    // Allow cleartext traffic only for local development
    allowMixedContent: false,
    // App icon is set via Android Studio resources
    backgroundColor: '#0f172a',
  },

  plugins: {
    // Local Notifications for overdue/follow-up alerts
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4f46e5',
      sound: 'beep.wav',
    },
    // Persistent key-value storage for sync state
    Preferences: {
      group: 'PNPCRMStorage',
    },
    // SQLite for offline local database
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
    },
  },
};

export default config;
