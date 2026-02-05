# Vony Mobile App Setup Guide

This guide will help you convert your VonyPortal web app into native iOS and Android apps using Capacitor.

## Prerequisites

- Node.js installed
- For iOS: Mac with Xcode installed (from App Store)
- For Android: Android Studio installed

## Step 1: Install Capacitor

Run these commands in your VonyPortal directory:

```bash
# Install Capacitor core and CLI
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor (skip if capacitor.config.ts already exists)
npx cap init Vony com.vony.lend --web-dir dist

# Install platform-specific packages
npm install @capacitor/ios @capacitor/android

# Install useful plugins
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/push-notifications
```

## Step 2: Build Your Web App

```bash
# Build the production version
npm run build
```

## Step 3: Add Platforms

```bash
# Add iOS platform (Mac only)
npx cap add ios

# Add Android platform
npx cap add android
```

## Step 4: Sync Your Code

Every time you make changes to your web app:

```bash
# Build and sync
npm run build
npx cap sync
```

## Step 5: Open in Native IDEs

```bash
# Open in Xcode (iOS)
npx cap open ios

# Open in Android Studio (Android)
npx cap open android
```

## Step 6: Run on Device/Simulator

### iOS (in Xcode):
1. Select your target device/simulator
2. Click the Play button (▶️)
3. For physical device: You need an Apple Developer account

### Android (in Android Studio):
1. Select your target device/emulator
2. Click the Run button (▶️)

## App Icons & Splash Screens

### Generate App Icons
Create a 1024x1024 PNG icon and use a tool like:
- https://appicon.co/
- https://www.appicon.build/

Place generated icons in:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

### Splash Screen
Create a 2732x2732 PNG splash image and place in:
- iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`
- Android: `android/app/src/main/res/drawable/`

## Publishing

### iOS App Store:
1. Create an Apple Developer account ($99/year)
2. Create App Store Connect listing
3. Archive in Xcode → Upload to App Store Connect
4. Submit for review

### Google Play Store:
1. Create Google Play Developer account ($25 one-time)
2. Create app listing in Play Console
3. Build signed APK/AAB in Android Studio
4. Upload and submit for review

## Quick Commands Reference

```bash
# Full rebuild and sync
npm run build && npx cap sync

# Open iOS project
npx cap open ios

# Open Android project
npx cap open android

# Live reload during development (add to capacitor.config.ts server.url)
npm run dev
# Then in another terminal:
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

## Troubleshooting

### iOS Build Fails
- Make sure Xcode Command Line Tools are installed: `xcode-select --install`
- Check signing certificates in Xcode

### Android Build Fails
- Make sure ANDROID_HOME environment variable is set
- Update Android Studio and SDK tools

### White Screen on App Load
- Make sure you ran `npm run build` before `npx cap sync`
- Check that `webDir` in capacitor.config.ts matches your build output folder
