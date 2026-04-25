const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Store the original resolver from Expo's default config
const originalResolveRequest = config.resolver.resolveRequest;

// Fix module resolution ONLY for specific relative import cases:
// 1. react-native-web directory exports (./exports/Vibration -> ./exports/Vibration/index.js)
// 2. @expo/vector-icons relative imports without extensions (./AntDesign -> ./AntDesign.js)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // NEVER interfere with non-relative imports (react-native, expo-*, etc.)
  // These must use the default resolver to avoid Platform.OS and other core module issues
  if (!moduleName.startsWith(".")) {
    // Use original resolver for all non-relative imports
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    // Fallback to default (shouldn't happen with Expo's config)
    return context.resolveRequest(context, moduleName, platform);
  }

  // ONLY handle relative imports from specific known problematic packages
  const isRelative = moduleName.startsWith(".");
  if (isRelative && context.originModulePath) {
    const isFromVectorIcons =
      context.originModulePath.includes("@expo") &&
      context.originModulePath.includes("vector-icons");
    const isFromReactNativeWeb =
      context.originModulePath.includes("react-native-web") &&
      context.originModulePath.includes("dist");

    // Only apply our custom logic for these specific cases
    if (isFromVectorIcons || isFromReactNativeWeb) {
      const originDir = path.dirname(context.originModulePath);
      const resolved = path.resolve(originDir, moduleName);

      // Try directory/index.js first (for react-native-web)
      const indexPath = path.join(resolved, "index.js");
      if (fs.existsSync(indexPath)) {
        return { type: "sourceFile", filePath: indexPath };
      }

      // Try adding .js extension (for @expo/vector-icons)
      const jsPath = resolved + ".js";
      if (fs.existsSync(jsPath)) {
        return { type: "sourceFile", filePath: jsPath };
      }
    }
  }

  // For all other relative imports, use the original resolver
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  // Fallback (shouldn't happen)
  return context.resolveRequest(context, moduleName, platform);
};

// Fix pdf-lib tslib conflict — force all tslib imports to use the top-level version
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  tslib: require.resolve("tslib"),
};

module.exports = config;
