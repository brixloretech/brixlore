/**
 * Utility functions.
 * Use for helpers, formatters, and shared logic.
 */

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
