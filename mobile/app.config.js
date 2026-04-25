module.exports = ({ config }) => {
  const easGoogleServicesPath = process.env.GOOGLE_SERVICES_JSON;
  const nextConfig = {
    ...config,
    android: {
      ...(config.android ?? {}),
    },
  };

  // Only set googleServicesFile from EAS file env var.
  // If not present, remove the field to prevent remote build failures.
  if (easGoogleServicesPath) {
    nextConfig.android = {
      ...nextConfig.android,
      googleServicesFile: easGoogleServicesPath,
    };
  } else if (nextConfig.android?.googleServicesFile) {
    delete nextConfig.android.googleServicesFile;
  }

  return nextConfig;
};
