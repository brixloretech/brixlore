"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { waitlistService } from "@/lib/services";
import { getApiErrorMessage } from "@/lib/api-client";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { MorphingText } from "@/components/ui/morphing-text";
import { BorderBeam } from "../ui/border-beam";

type Step = "name" | "email" | "phone";
const steps: Step[] = ["name", "email", "phone"];

const labels: Record<Step, string> = {
  name: "What should we call you?",
  email: "Where can we reach you?",
  phone: "Your phone number (optional)",
};

const socialLinks = [
  { label: "YouTube", href: "https://youtube.com/@brixlore?si=0SyB5xL99PWqSCnW", icon: "▶" },
  { label: "Facebook", href: "https://www.facebook.com/share/18RtyTkRXA/", icon: "f" },
  { label: "X", href: "https://x.com/Brixlore", icon: "𝕏" },
  { label: "TikTok", href: "https://www.tiktok.com/@brixloretv?_r=1&_t=ZT-94mHGk4okzV", icon: "♪" },
];

export default function WaitlistLanding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("name");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    emailConsent: false,
    smsConsent: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, step, submitting]);

  function start() {
    setOpen(true);
    setSubmitted(false);
    setStep("name");
    setError("");
  }

  function close() {
    if (!submitting) setOpen(false);
  }

  function validateCurrent() {
    if (step === "name" && form.name.trim().length < 2)
      return "Please enter your name.";
    if (step === "email" && !/^\S+@\S+\.\S+$/.test(form.email))
      return "Please enter a valid email.";
    if (step === "phone" && form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        return "Please enter a valid phone number or skip this step.";
      }
    }
    return "";
  }

  async function advance(event?: FormEvent) {
    event?.preventDefault();
    const validationError = validateCurrent();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    const currentIndex = steps.indexOf(step);
    if (step !== "phone") {
      setStep(steps[currentIndex + 1]);
      return;
    }
    setSubmitting(true);
    try {
      await waitlistService.submit({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    const index = steps.indexOf(step);
    if (index > 0) {
      setError("");
      setStep(steps[index - 1]);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b0e] text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        <source src="/LandingPageBanner.mp4" type="video/mp4" />
      </video>
      {/* <div className="absolute inset-0 bg-[#050507]/65" /> */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-transparent to-[#000000]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-28 sm:px-10">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl lg:text-8xl">
            Where urban media
          </h1>

          <MorphingText
            texts={["connects", "unfolds", "evolves", "breaks", "streams"]}
          />
          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-neutral-200/85 sm:text-lg">
            Where authentic culture meets prestige broadcast. Be the first to
            experience the next evolution of urban media.
          </p>
          <ShimmerButton
            onClick={start}
            className="mt-5 inline-flex items-center justify-center"
          >
            Get Early Access
          </ShimmerButton>
          <p className="mt-5 text-xs text-neutral-300/65">
            Join the list. No noise, just the good stuff.
          </p>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="waitlist-title"
        >
          <button
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            aria-label="Close waitlist form"
            onClick={close}
          />
          <div className="relative z-0 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#111116]/95 p-7 !pt-14 shadow-2xl shadow-black/50 sm:p-9">
            <button
              onClick={close}
              disabled={submitting}
              className="absolute right-5 top-5 text-2xl leading-none text-neutral-400 transition hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
            {!submitted ? (
              <>
                <div
                  className="mb-8 flex gap-1.5"
                  aria-label={`Step ${steps.indexOf(step) + 1} of ${steps.length}`}
                >
                  {steps.map((item) => (
                    <span
                      key={item}
                      className={`h-1 flex-1 rounded-full transition-colors ${steps.indexOf(item) <= steps.indexOf(step) ? "bg-white" : "bg-white/15"}`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Early access · {steps.indexOf(step) + 1} / {steps.length}
                </p>
                <h2
                  id="waitlist-title"
                  className="mt-3 text-3xl font-semibold tracking-tight text-white"
                >
                  {labels[step]}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  A few quick details and you are in.
                </p>
                <form onSubmit={advance} className="mt-8">
                  <input
                    ref={inputRef}
                    value={form[step]}
                    onChange={(event) =>
                      setForm({ ...form, [step]: event.target.value })
                    }
                    type={step === "email" ? "email" : step === "phone" ? "tel" : "text"}
                    placeholder={
                      step === "name"
                        ? "Your name"
                        : step === "email"
                          ? "you@example.com"
                          : "777 222 1111"
                    }
                    autoComplete={step === "phone" ? "tel" : step}
                    className="h-14 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-neutral-500 focus:border-white/50 focus:bg-white/[0.1]"
                  />
                  {step === "phone" && (
                    <p className="mt-3 text-sm text-neutral-400">
                      Country code is optional. Leave this blank to skip.
                    </p>
                  )}
                  {error && (
                    <p className="mt-3 text-sm text-red-300" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="mt-7 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={step === "name" || submitting}
                      className="rounded-full px-4 py-3 text-sm text-neutral-400 transition hover:text-white disabled:invisible"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b0b0e] transition hover:bg-neutral-200 disabled:opacity-60"
                    >
                      {submitting
                        ? "Joining…"
                        : step === "phone"
                          ? "Join the waitlist"
                          : "Continue"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-[#0b0b0e]">
                  ✓
                </div>
                <h2
                  id="waitlist-title"
                  className="mt-6 text-3xl font-semibold tracking-tight"
                >
                  You are on the list.
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  Thanks, {form.name.split(" ")[0]}. We will be in touch when
                  Brixlore is ready.
                </p>
                <div className="mt-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Follow along
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Follow Brixlore on ${social.label}`}
                        title={social.label}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-base font-semibold text-white transition hover:border-white/45 hover:bg-white/10"
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
                <button
                  onClick={close}
                  className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Done
                </button>
              </div>
            )}
            <BorderBeam
              colorFrom="#ffffff"
              colorTo="#9ca3af"
              duration={6}
              delay={3}
              size={400}
              borderWidth={2}
              className="from-transparent #9ca3af to-transparent"
            />
          </div>
        </div>
      )}
    </main>
  );
}
