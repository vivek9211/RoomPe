const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // You can set env vars when starting Metro. Access via process.env in JS.
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
