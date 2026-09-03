import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const authInputClass =
  "h-14 rounded-xl border-white/12 bg-white/[0.045] px-4 text-[15px] text-white shadow-inner shadow-black/20 placeholder:text-white/24 transition-colors hover:border-white/22 focus:border-white/55 focus:bg-white/[0.065] focus:ring-4 focus:ring-white/[0.07] disabled:border-white/[0.07] disabled:bg-white/[0.025] disabled:text-white/35";

export function AuthCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0c]/95 text-white shadow-[0_28px_100px_rgba(0,0,0,.5)]",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {children}
    </section>
  );
}

export function AuthHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("px-5 pb-6 pt-7 sm:px-8 sm:pt-9", className)}>
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-3 !text-3xl font-semibold tracking-[-0.055em] !text-white sm:!text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/48">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}

export function AuthContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 sm:px-8", className)}>{children}</div>;
}

export function AuthFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "mt-7 border-t border-white/[0.08] px-5 py-6 sm:px-8",
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function AuthButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/82 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthNotice({
  children,
  tone = "error",
  className,
}: {
  children: ReactNode;
  tone?: "error" | "success" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-6",
        tone === "error" && "border-red-300/20 bg-red-300/[0.07] text-red-100",
        tone === "success" && "border-white/15 bg-white/[0.07] text-white/75",
        tone === "neutral" && "border-white/10 bg-white/[0.035] text-white/55",
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
