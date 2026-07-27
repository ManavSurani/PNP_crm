import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App identity
  appId: 'com.pnp.crm',
  appName: 'PNP CRM',

  // Points to Vite's production build output (loaded offline directly inside APK)
  webDir: 'dist',

  server: {
    // Allow cleartext HTTP connections for local IP or Cloudflare Tunnel sync
    cleartext: true,
    allowNavigation: ['*'],
  },

  android: {
    // Allow mixed content for local development & sync APIs
    allowMixedContent: true,
    backgroundColor: '#0f172a',
    buildOptions: {
      releaseType: 'APK',
    },
  },

  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4f46e5',
      sound: 'beep.wav',
    },
    Preferences: {
      group: 'PNPCRMStorage',
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
    },
  },
};

export default config;
