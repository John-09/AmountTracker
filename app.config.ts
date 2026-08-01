import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AmountTracker',
  slug: 'amount-tracker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/amounttracker-icon.png',
  scheme: 'amounttracker',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.john.amounttracker',
    supportsTablet: true,
  },
  android: {
    package: 'com.john.amounttracker',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#EAF7F0',
      foregroundImage: './assets/images/amounttracker-icon.png',
    },
    predictiveBackGestureEnabled: true,
  },
  web: {
    output: 'static',
    favicon: './assets/images/amounttracker-icon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-document-picker',
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        icon: './assets/images/android-icon-monochrome.png',
        color: '#14804A',
        defaultChannel: 'daily-expense-reminders',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F4FBF7',
        image: './assets/images/amounttracker-icon.png',
        imageWidth: 128,
        dark: {
          backgroundColor: '#0E1813',
          image: './assets/images/amounttracker-icon.png',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
