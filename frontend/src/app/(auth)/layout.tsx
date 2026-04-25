/**
 * (auth) — Authentication route group
 *
 * Purpose: Sign-in, sign-up, password reset, and other auth flows.
 * Use for: /login, /signup, /forgot-password, /verify-email, etc.
 * URL segments: (auth) does not appear (e.g. /login, /signup).
 * Typically: Centered card layout, no main site header/footer.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-off-black">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
