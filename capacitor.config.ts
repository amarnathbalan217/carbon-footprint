import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carbontracker.app',
  appName: 'Carbon Tracker',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
