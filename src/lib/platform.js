import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Check if running as a native mobile app
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

// Check specific platforms
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

// Open URL in system browser (for OAuth)
export const openInBrowser = async (url) => {
  if (isNativeApp()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
};

// Close the browser (after OAuth callback)
export const closeBrowser = async () => {
  if (isNativeApp()) {
    try {
      await Browser.close();
    } catch (e) {
      // Browser might already be closed
    }
  }
};

// Get the appropriate redirect URL for OAuth
export const getOAuthRedirectUrl = () => {
  if (isNativeApp()) {
    // Use a deep link URL for mobile apps
    return 'com.vony.lend://auth/callback';
  }
  // Use website URL for web
  return 'https://lend-with-vony.com';
};
