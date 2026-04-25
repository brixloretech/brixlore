import Link from "next/link";

/**
 * Custom 404 page. Kept minimal so Next can collect page data for /_not-found at build time.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-off-black px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-lg text-neutral-400">This page could not be found.</p>
      <Link
        href="/"
        className="rounded bg-accent px-4 py-2 font-medium text-accent-foreground hover:bg-accent/90"
      >
        Go home
      </Link>
    </div>
  );
}
