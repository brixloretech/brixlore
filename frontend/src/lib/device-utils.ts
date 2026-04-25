/**
 * Device detection and identification utilities.
 * Used for registering devices when users log in.
 */

export type DevicePlatform = "ANDROID" | "IOS" | "WEB";

/**
 * Detect the platform (Android/iOS/WEB) from user agent.
 */
export function detectPlatform(): DevicePlatform {
  if (typeof window === "undefined") return "WEB";
  const ua = window.navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "ANDROID";
  if (/iphone|ipad|ipod/.test(ua)) return "IOS";
  return "WEB";
}

/**
 * Generate a device identifier from browser/device info.
 * Uses a combination of screen size, user agent, and timezone.
 */
export function generateDeviceIdentifier(): string {
  if (typeof window === "undefined") return "unknown-device";
  
  const parts: string[] = [];
  
  // Screen resolution
  if (window.screen) {
    parts.push(`${window.screen.width}x${window.screen.height}`);
  }
  
  // User agent (simplified)
  const ua = window.navigator.userAgent;
  if (/chrome/i.test(ua)) parts.push("Chrome");
  else if (/firefox/i.test(ua)) parts.push("Firefox");
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) parts.push("Safari");
  else if (/edge/i.test(ua)) parts.push("Edge");
  else parts.push("Browser");
  
  // Platform
  const platform = detectPlatform();
  if (platform) {
    parts.push(platform);
  } else {
    // Try to detect OS from user agent
    if (/windows/i.test(ua)) parts.push("Windows");
    else if (/mac/i.test(ua)) parts.push("macOS");
    else if (/linux/i.test(ua)) parts.push("Linux");
  }
  
  // Timezone
  try {
    parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    // ignore
  }
  
  return parts.join("-");
}

/**
 * Get a friendly device name for display.
 */
export function getDeviceDisplayName(deviceIdentifier: string, platform: DevicePlatform): string {
  if (typeof window === "undefined") return deviceIdentifier;
  
  // If it's a mobile device, try to get a better name
  if (platform === "IOS") {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone/.test(ua)) return "iPhone";
    if (/ipad/.test(ua)) return "iPad";
    return "iOS Device";
  }
  
  if (platform === "ANDROID") {
    return "Android Device";
  }
  
  // For web browsers, try to extract browser and OS name
  if (platform === "WEB") {
    const ua = window.navigator.userAgent;
    let browserName = "Browser";
    let osName = "";
    
    // Detect browser
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) browserName = "Chrome";
    else if (/firefox/i.test(ua)) browserName = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browserName = "Safari";
    else if (/edge/i.test(ua)) browserName = "Edge";
    
    // Detect OS
    if (/windows/i.test(ua)) osName = " on Windows";
    else if (/mac/i.test(ua)) osName = " on macOS";
    else if (/linux/i.test(ua)) osName = " on Linux";
    
    return `${browserName}${osName}`;
  }
  
  // Fallback: use first part of identifier
  const firstPart = deviceIdentifier.split("-")[0];
  if (firstPart && firstPart !== deviceIdentifier) {
    return `${firstPart} Device`;
  }
  
  return "Web Browser";
}
