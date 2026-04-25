/**
 * Brixlore dark theme — matches https://brick-tales-web.vercel.app/
 * Extracted from web app: background #0b0b0e, foreground #f5f7fb, accent #e5e7eb.
 * Dark theme only.
 */

export const colors = {
  primary: '#e5e7eb',
  secondary: '#9ca3af',
  background: '#0b0b0e',
  surface: '#141418',
  card: '#18181c',
  accent: '#e5e7eb',
  textPrimary: '#f5f7fb',
  textSecondary: 'rgba(245, 247, 251, 0.85)',
  muted: '#6b7280',
  border: 'rgba(255, 255, 255, 0.1)',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#f87171',
} as const;

export type ThemeColors = typeof colors;

/**
 * Reusable dark theme object (colors only).
 * Use for styling components; combine with spacing/typography as needed.
 */
export const darkTheme = {
  colors,
  isDark: true as const,
} as const;

export default colors;
