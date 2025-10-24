const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Exclude native modules when building for web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exclude native-only modules on web
  if (platform === 'web') {
    if (
      moduleName === 'react-native-google-mobile-ads' ||
      moduleName === 'react-native-purchases' ||
      moduleName.startsWith('react-native-google-mobile-ads/') ||
      moduleName.startsWith('react-native-purchases/')
    ) {
      // Return a mock/empty module
      return {
        type: 'empty',
      };
    }
  }

  // Otherwise, use the default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
