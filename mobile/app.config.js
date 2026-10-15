const fs = require("fs");
const path = require("path");

function frontendTestPublishableKey() {
  const envPath = path.resolve(__dirname, "../frontend/.env.local");
  try {
    const contents = fs.readFileSync(envPath, "utf8");
    const match = contents.match(
      /^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(pk_test_[^\s#]+)$/m,
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}

module.exports = ({ config }) => {
  const easGoogleServicesPath = process.env.GOOGLE_SERVICES_JSON;
  // Reuse the web app's test Stripe publishable key for local/mobile QA.
  // Production builds must supply their own EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.
  const stripePublishableKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    frontendTestPublishableKey();
  const nextConfig = {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      stripePublishableKey,
    },
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
