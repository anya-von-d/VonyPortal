import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vony.lend',
  appName: 'Vony',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    hostname: 'localhost',
    // Allow navigation to Supabase auth URLs
    allowNavigation: [
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
      'lend-with-vony.com'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
