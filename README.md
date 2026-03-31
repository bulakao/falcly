# Falcly

Credit card timing and payment intelligence app. Answers one question: **"Is it safe to use my card right now?"**

Falcly is a billing cycle intelligence tool — it knows where you are in your billing cycle, what you owe, what's coming in, and tells you whether swiping today is safe or risky.

**Platform:** Android-first, iOS parity at launch.

## Prerequisites

- [Node.js](https://nodejs.org/) v22 (see `.nvmrc`)
- [Expo CLI](https://docs.expo.dev/get-started/set-up-your-environment/)
- For iOS: macOS with [Xcode](https://developer.apple.com/xcode/) installed (including Xcode Command Line Tools)
- For Android: [Android Studio](https://developer.android.com/studio) with an emulator configured, or a physical device

## Setup

```bash
# Clone the repo
git clone git@github.com:bulakao/falcly.git
cd falcly

# Use the correct Node version
nvm use

# Install dependencies
npm install
```

## Running the app

### iOS (requires macOS + Xcode)

```bash
npm run ios
```

This starts the Expo dev server and launches the iOS Simulator. To run on a physical device, install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) and scan the QR code.

### Android

```bash
npm run android
```

This starts the Expo dev server and launches the Android emulator. To run on a physical device, install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) and scan the QR code.

### Start dev server only

```bash
npm start
```

Then press `i` for iOS or `a` for Android in the terminal.

## Project structure

```
app/           Expo Router screens and layouts
assets/        Fonts, images, splash screen
components/    Reusable React Native components
constants/     Theme and config values
docs/          PRD and discovery notes
```
