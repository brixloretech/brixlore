"use client";

import { useState } from "react";
import { siteService } from "@/lib/services";
import { getApiErrorMessage } from "@/lib/api-client";
import { validateEmail, validateRequired } from "@/lib/validation";

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export function HelpCenterSupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function runValidation(): boolean {
    const nextErrors: FormErrors = {
      name: validateRequired(name, "Name") ?? undefined,
      email: validateEmail(email) ?? undefined,
      subject: validateRequired(subject, "Subject") ?? undefined,
      message: validateRequired(message, "Message") ?? undefined,
    };
    setErrors(nextErrors);
    return (
      !nextErrors.name &&
      !nextErrors.email &&
      !nextErrors.subject &&
      !nextErrors.message
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setSubmitError(null);
    if (!runValidation()) return;

    setSubmitting(true);
    try {
      const response = await siteService.submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setNotice(response.message);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mt-4 max-w-md space-y-4" onSubmit={handleSubmit}>
      {notice ? (
        <div className="rounded border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </div>
      ) : null}
      {submitError ? (
        <div className="rounded border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {submitError}
        </div>
      ) : null}

      <div>
        <input
          type="text"
          placeholder="Your Name"
          className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          required
        />
        {errors.name ? (
          <p className="mt-1 text-xs text-red-400">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <input
          type="email"
          placeholder="Your Email"
          className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-400">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <input
          type="text"
          placeholder="Subject"
          className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={submitting}
          required
        />
        {errors.subject ? (
          <p className="mt-1 text-xs text-red-400">{errors.subject}</p>
        ) : null}
      </div>

      <div>
        <textarea
          placeholder="How can we help?"
          className="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          required
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-400">{errors.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
