"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api-client";
import { siteService } from "@/lib/services";
import { validateEmail, validateRequired } from "@/lib/validation";

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const fieldClass =
  "h-14 w-full rounded-none border-0 border-b border-black/20 bg-transparent px-0 text-[15px] text-black outline-none transition-colors placeholder:text-black/32 hover:border-black/45 focus:border-black disabled:cursor-not-allowed disabled:opacity-50";

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
    return Object.values(nextErrors).every((error) => !error);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {notice ? (
        <div
          className="flex gap-3 border border-black/20 bg-black px-4 py-4 text-sm leading-6 text-white"
          role="status"
        >
          <Check size={17} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      ) : null}
      {submitError ? (
        <div
          className="border border-red-900/25 bg-red-900/[0.07] px-4 py-4 text-sm leading-6 text-red-900"
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className="mb-2 block text-sm font-medium text-black/75">
            Your name
          </label>
          <input
            id="support-name"
            type="text"
            autoComplete="name"
            placeholder="Name"
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={submitting}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "support-name-error" : undefined}
          />
          {errors.name ? (
            <p id="support-name-error" className="mt-2 text-xs text-red-800" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="support-email" className="mb-2 block text-sm font-medium text-black/75">
            Email address
          </label>
          <input
            id="support-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "support-email-error" : undefined}
          />
          {errors.email ? (
            <p id="support-email-error" className="mt-2 text-xs text-red-800" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="support-subject" className="mb-2 block text-sm font-medium text-black/75">
          Subject
        </label>
        <input
          id="support-subject"
          type="text"
          placeholder="What should we know?"
          className={fieldClass}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          disabled={submitting}
          required
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "support-subject-error" : undefined}
        />
        {errors.subject ? (
          <p id="support-subject-error" className="mt-2 text-xs text-red-800" role="alert">
            {errors.subject}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="support-message" className="mb-2 block text-sm font-medium text-black/75">
          Message
        </label>
        <textarea
          id="support-message"
          placeholder="Tell us what happened, what you expected, and the device or browser you are using."
          className="min-h-44 w-full resize-y rounded-none border-0 border-b border-black/20 bg-transparent px-0 py-3 text-[15px] leading-7 text-black outline-none transition-colors placeholder:text-black/32 hover:border-black/45 focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={submitting}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "support-message-error" : undefined}
        />
        {errors.message ? (
          <p id="support-message-error" className="mt-2 text-xs text-red-800" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 border-t border-black/20 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-5 text-black/45">
          Your request is reviewed by the Brixlore support team.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-black px-7 text-sm font-semibold text-white transition-colors hover:bg-black/76 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? "Sending request..." : "Send support request"}
          {!submitting && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  );
}
