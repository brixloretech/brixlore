"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Film,
  Mail,
  MessageSquareText,
} from "lucide-react";
import { Input } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { siteService } from "@/lib/services";
import { validateEmail, validateRequired } from "@/lib/validation";

const fieldClass =
  "h-14 rounded-none border-0 border-b border-white/18 bg-transparent px-0 text-[15px] text-white shadow-none placeholder:text-white/25 hover:border-white/35 focus:border-white focus:bg-transparent focus:ring-0 disabled:bg-transparent";

const contactRoutes = [
  {
    number: "01",
    label: "General support",
    detail: "Accounts, playback, billing, or anything else.",
  },
  {
    number: "02",
    label: "Press & media",
    detail: "Interviews, company news, and editorial requests.",
    href: "/press-inquiries",
  },
  {
    number: "03",
    label: "Partnerships",
    detail: "Brand collaborations and cultural storytelling.",
    href: "/partners",
  },
  {
    number: "04",
    label: "Distribution",
    detail: "Bring your film, series, or original idea to Brixlore.",
    href: "/distribute",
  },
];

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
    if (prefillSubject) setSubject(prefillSubject);
    if (prefillMessage) setMessage(prefillMessage);
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
    return Object.values(nextErrors).every((error) => !error);
  }

  async function handleSubmit(event: React.FormEvent) {
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
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative min-h-[70svh] border-b border-white/15 pt-[125px] md:pt-[150px] lg:pt-[170px]">
        <Image
          src="/Distribute_bg.jpeg"
          alt="A cinematic Brixlore production scene"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-50 grayscale"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.96)_0%,rgba(0,0,0,.64)_52%,rgba(0,0,0,.22)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,.12),transparent_30%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:25%_100%]" />

        <div className="relative mx-auto flex min-h-[calc(70svh-125px)] max-w-[1800px] flex-col justify-between px-4 pb-10 sm:px-6 md:min-h-[calc(70svh-150px)] lg:min-h-[calc(70svh-170px)] lg:px-10 lg:pb-14 xl:px-[6vw]">
          <div className="flex items-center justify-between border-b border-white/20 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50 sm:text-xs">
            <span>Contact / Brixlore</span>
            <span className="hidden sm:block">Detroit · Available worldwide</span>
          </div>

          <div className="grid items-end gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_330px] lg:py-16">
            <h1 className="max-w-6xl text-[clamp(4rem,10.5vw,10rem)] font-semibold leading-[0.76] tracking-[-0.08em] !text-white">
              Let&apos;s make
              <span className="block pl-[8vw] font-light italic text-white/58">
                contact.
              </span>
            </h1>
            <div className="border-l border-white/25 pl-6 lg:pb-2">
              <p className="text-base leading-7 text-white/68">
                A question, a pitch, or a story worth sharing—send it our way.
                The right team will pick up the signal.
              </p>
              <a
                href="#message"
                className="mt-7 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/80"
              >
                Start a conversation <ArrowDown size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="message" className="relative bg-[#070707]">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-[120px]" />
        <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)]">
          <aside className="border-b border-white/15 px-4 py-16 sm:px-6 sm:py-20 lg:border-b-0 lg:border-r lg:px-10 lg:py-28 xl:pl-[6vw] xl:pr-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
              Find the right door
            </p>
            <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-[0.95] tracking-[-0.055em] !text-white sm:text-5xl">
              One studio. A few ways in.
            </h2>

            <div className="mt-12 border-t border-white/15">
              {contactRoutes.map((route) => {
                const content = (
                  <>
                    <span className="pt-1 text-[10px] font-semibold tracking-[0.16em] text-white/28">
                      {route.number}
                    </span>
                    <span>
                      <strong className="block text-base font-semibold text-white">
                        {route.label}
                      </strong>
                      <span className="mt-1 block max-w-sm text-xs leading-5 text-white/40">
                        {route.detail}
                      </span>
                    </span>
                    {route.href ? (
                      <ArrowUpRight
                        size={16}
                        className="ml-auto mt-1 text-white/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                      />
                    ) : (
                      <MessageSquareText
                        size={16}
                        className="ml-auto mt-1 text-white/35"
                      />
                    )}
                  </>
                );

                return route.href ? (
                  <Link
                    key={route.number}
                    href={route.href}
                    className="group grid grid-cols-[30px_minmax(0,1fr)_20px] gap-3 border-b border-white/15 py-6 transition-colors hover:border-white/45"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={route.number}
                    className="grid grid-cols-[30px_minmax(0,1fr)_20px] gap-3 border-b border-white/15 py-6"
                  >
                    {content}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              <div className="border border-white/12 p-4">
                <Clock3 size={16} className="mb-5 text-white/65" />
                Response in 1–2 business days
              </div>
              <div className="border border-white/12 p-4">
                <Film size={16} className="mb-5 text-white/65" />
                Every message reaches a real team
              </div>
            </div>
          </aside>

          <div className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28 xl:pl-16 xl:pr-[6vw]">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-white/[0.035] xl:block" />
            <div className="relative mx-auto max-w-3xl">
              <div className="mb-10 flex items-end justify-between gap-5 border-b border-white/15 pb-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                    New inquiry
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] !text-white sm:text-5xl">
                    Tell us what&apos;s on your mind.
                  </h2>
                </div>
                <span className="hidden h-11 w-11 place-items-center rounded-full border border-white/15 text-white/45 sm:grid">
                  <Mail size={17} />
                </span>
              </div>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="[&_label]:!text-white/70"
              >
                <div className="space-y-8">
                  {notice ? (
                    <div
                      className="flex gap-3 border border-white/16 bg-white/[0.055] px-4 py-4 text-sm leading-6 text-white/75"
                      role="status"
                    >
                      <Check size={17} className="mt-0.5 shrink-0" />
                      {notice}
                    </div>
                  ) : null}
                  {submitError ? (
                    <div
                      className="border border-red-200/20 bg-red-200/[0.06] px-4 py-4 text-sm leading-6 text-red-100"
                      role="alert"
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <div className="grid gap-8 sm:grid-cols-2">
                    <Input
                      label="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Name"
                      error={errors.name}
                      disabled={submitting}
                      required
                      className={fieldClass}
                    />
                    <Input
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      error={errors.email}
                      disabled={submitting}
                      required
                      className={fieldClass}
                    />
                  </div>

                  <Input
                    label="Subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="What should we know?"
                    error={errors.subject}
                    disabled={submitting}
                    required
                    className={fieldClass}
                  />

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-3 block text-sm font-medium text-neutral-300"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      className="min-h-44 w-full resize-y border-0 border-b border-white/18 bg-transparent px-0 py-3 text-[15px] leading-7 text-white outline-none transition-colors placeholder:text-white/25 hover:border-white/35 focus:border-white disabled:cursor-not-allowed disabled:opacity-50"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Write your message here..."
                      disabled={submitting}
                      required
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "contact-message-error" : undefined
                      }
                    />
                    {errors.message ? (
                      <p
                        id="contact-message-error"
                        className="mt-1.5 text-sm text-red-300"
                        role="alert"
                      >
                        {errors.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xs text-xs leading-5 text-white/32">
                    By sending this form, you agree that our team may contact
                    you about this request.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-white px-7 text-sm font-semibold text-black transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submitting ? "Sending message..." : "Send message"}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-white px-4 py-16 !text-black sm:px-6 sm:py-20 lg:px-10 xl:px-[6vw] [&_h2]:!text-black">
        <div className="mx-auto grid max-w-[1800px] gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <h2 className="max-w-5xl text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-7xl lg:text-[7rem]">
            Your next story might start here.
          </h2>
          <div>
            <p className="text-sm leading-7 text-black/58">
              Explore independent films and original series while our team gets
              back to you.
            </p>
            <Link
              href="/browse-2"
              className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-black px-6 text-sm font-semibold text-white transition-colors hover:bg-black/75"
            >
              Browse Brixlore <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
