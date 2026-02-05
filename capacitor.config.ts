import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vony.lend',
  appName: 'Vony',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Use the production server instead of bundled assets for now
    // This ensures OAuth works properly on mobile
    url: 'https://lend-with-vony.com',
    cleartext: true
  },
};

export default config;
