// Release Android builds refuse plain http:// by default. The preview APK is for demos against a backend on a laptop
// (http://192.168.x.x:8080), so it allows http; the production app bundle (Play Store) stays https only.
module.exports = ({ config }) => {
  const allowHttp = process.env.EAS_BUILD_PROFILE !== 'production';
  return {
    ...config,
    plugins: [...(config.plugins ?? []), ['expo-build-properties', { android: { usesCleartextTraffic: allowHttp } }]],
  };
};
