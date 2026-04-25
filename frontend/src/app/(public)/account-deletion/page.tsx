import type { Metadata } from "next";
import Link from "next/link";
import AccountDeletionRequestForm from "./AccountDeletionRequestForm";

export const metadata: Metadata = {
  title: "Account Deletion",
  description:
    "How to request deletion of your Brixlore account and associated personal data.",
};

export default function AccountDeletionPage() {
  return (
    <main className="flex-1 bg-[#050505] px-4 py-12 text-white sm:px-6 lg:px-8">
      <article className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
            Privacy & Data
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Account Deletion
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-300 sm:text-base">
            You can request deletion of your Brixlore account and associated
            personal data at any time.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
            <h2 className="text-xl font-semibold text-white">
              1. Delete directly in the app
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Open the mobile app and go to Settings, then choose Delete
              account. This action permanently removes your account.
            </p>
          </section>

          <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
            <h2 className="text-xl font-semibold text-white">
              2. Request deletion from the web
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              If you cannot access the app, you can submit an account deletion
              request directly on this page.
            </p>
          </section>

          <AccountDeletionRequestForm />

          <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
            <h2 className="text-xl font-semibold text-white">
              3. What data is deleted
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              When your request is completed, we delete your account profile,
              sign-in credentials, and account-linked app data associated with
              your user identity.
            </p>
          </section>

          <section className="rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
            <h2 className="text-xl font-semibold text-white">
              4. Data retention
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              Some records may be retained for up to 30 days for fraud
              prevention, legal, tax, accounting, and security obligations.
              After that period, retained records are deleted or anonymized as
              required by applicable law.
            </p>
            <p className="mt-4 text-sm leading-6 text-neutral-300">
              You can also send deletion requests through our{" "}
              <Link
                href="/contact"
                className="font-semibold text-white underline decoration-neutral-500 underline-offset-4 transition-colors hover:decoration-white"
              >
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
