const IS_PROD = process.env.APP_ENV === 'production';
const env = IS_PROD ? 'prod' : 'dev';

export default {
  expo: {
    name: IS_PROD ? 'Falcly' : 'Falcly (Dev)',
    slug: 'falcly',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'falcly',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_PROD ? 'com.bulakao.falcly' : 'com.bulakao.falcly.dev',
      googleServicesFile: `./firebase/${env}/GoogleService-Info.plist`,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: IS_PROD ? 'com.bulakao.falcly' : 'com.bulakao.falcly.dev',
      googleServicesFile: `./firebase/${env}/google-services.json`,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
