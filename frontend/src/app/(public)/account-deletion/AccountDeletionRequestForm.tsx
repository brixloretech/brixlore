"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { siteService } from "@/lib/services";
import { validateEmail, validateRequired } from "@/lib/validation";

const ACCOUNT_DELETION_SUBJECT = "Account Deletion Request";

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export default function AccountDeletionRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    "Please delete my Brixlore account and associated personal data. My account email is: ",
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function runValidation(): boolean {
    const nextErrors: FormErrors = {
      name: validateRequired(name, "Name") ?? undefined,
      email: validateEmail(email) ?? undefined,
      message: validateRequired(message, "Request") ?? undefined,
    };
    setErrors(nextErrors);
    return !nextErrors.name && !nextErrors.email && !nextErrors.message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setSubmitError(null);
    if (!runValidation()) return;
    setSubmitting(true);
    try {
      const res = await siteService.submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: ACCOUNT_DELETION_SUBJECT,
        message: message.trim(),
      });
      setNotice(res.message);
      setName("");
      setEmail("");
      setMessage(
        "Please delete my Brixlore account and associated personal data. My account email is: ",
      );
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-neutral-800/90 bg-neutral-950/85 p-6">
      <h2 className="text-xl font-semibold text-white">Request deletion now</h2>
      <p className="mt-3 text-sm leading-6 text-neutral-300">
        Submit this form and your request will be sent to Brixlore Customer
        Support for processing.
      </p>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {notice ? (
          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </div>
        ) : null}
        {submitError ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
            {submitError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            error={errors.name}
            disabled={submitting}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={errors.email}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">
            Request details
          </label>
          <textarea
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            required
          />
          {errors.message ? (
            <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit account deletion request"}
          </Button>
          <Link
            href="/contact"
            className="text-sm text-neutral-400 underline hover:text-accent"
          >
            Open full contact form
          </Link>
        </div>
      </form>
    </div>
  );
}
