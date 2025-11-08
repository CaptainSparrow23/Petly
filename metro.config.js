const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// SVG transformer configuration
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');
config.resolver.assetExts.push('riv');

// Wrap with NativeWind and export
module.exports = withNativeWind(config, {
  input: './app/global.css',
  configPath: path.resolve(__dirname, 'tailwind.config.js'),
});
