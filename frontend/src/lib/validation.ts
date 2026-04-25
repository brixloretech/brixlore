/**
 * Basic validation helpers for forms. No backend dependency.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(value.trim()))
    return "Please enter a valid email address.";
  return null;
}

export function validatePassword(
  value: string,
  options?: { minLength?: number },
): string | null {
  const min = options?.minLength ?? 8;
  if (!value) return "Password is required.";
  if (value.length < min) return `Password must be at least ${min} characters.`;
  return null;
}

export function validateRequired(
  value: string,
  fieldName = "This field",
): string | null {
  if (!value.trim()) return `${fieldName} is required.`;
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
): string | null {
  if (confirmPassword !== password) return "Passwords do not match.";
  return null;
}
