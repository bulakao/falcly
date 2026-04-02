module.exports = {
  expo: {
    name: 'Falcly',
    slug: 'falcly',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'falcly',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    backgroundColor: '#1e2a40',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F8F9FA',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bulakao.falcly',
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F8F9FA',
        dark: {
          image: './assets/images/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#1e2a40',
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#1e2a40',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.bulakao.falcly',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
      '@react-native-google-signin/google-signin',
      './plugins/withXcode26Compat',
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
