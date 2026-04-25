"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { siteService } from "@/lib/services";
import { getApiErrorMessage } from "@/lib/api-client";
import { validateEmail, validateRequired } from "@/lib/validation";

export default function ContactPage() {
  const hasPrefilled = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (hasPrefilled.current) return;
    const params = new URLSearchParams(window.location.search);
    const prefillSubject = params.get("subject")?.trim();
    const prefillMessage = params.get("message")?.trim();
    if (prefillSubject) {
      setSubject(prefillSubject);
    }
    if (prefillMessage) {
      setMessage(prefillMessage);
    }
    hasPrefilled.current = true;
  }, []);

  function runValidation(): boolean {
    const nextErrors = {
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
        subject: subject.trim(),
        message: message.trim(),
      });
      setNotice(res.message);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <Card className="w-full max-w-2xl border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Contact us</CardTitle>
          <p className="mt-1 text-sm text-neutral-400">
            Have a question or issue? Send us a message and our support team
            will reply soon.
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="How can we help?"
              error={errors.subject}
              disabled={submitting}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Message
              </label>
              <textarea
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                disabled={submitting}
              />
              {errors.message ? (
                <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send message"}
            </Button>
            <Link
              href="/browse"
              className="text-sm text-neutral-400 underline hover:text-accent"
            >
              Back to browse
            </Link>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
