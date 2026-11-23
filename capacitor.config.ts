// Capacitor configuration for compiling native Android (.apk / .aab) and iOS apps
const config = {
  appId: 'com.machenike.hub',
  appName: 'Machenike Hub',
  webDir: 'dist',
  backgroundColor: '#0C0E12',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
