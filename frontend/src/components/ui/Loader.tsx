import { cn } from "@/lib/utils";

export type LoaderVariant = "spinner" | "dots" | "pulse";

const spinnerStyles =
  "animate-spin rounded-full border-2 border-current border-t-transparent";

export interface LoaderProps {
  /** Visual style of the loader */
  variant?: LoaderVariant;
  /** Size (spinner: width/height; dots: gap and dot size) */
  size?: "sm" | "md" | "lg";
  /** Optional label for screen readers */
  label?: string;
  className?: string;
}

const sizeStyles = {
  sm: { spinner: "h-4 w-4", dots: "gap-1", dot: "h-1.5 w-1.5" },
  md: { spinner: "h-6 w-6", dots: "gap-1.5", dot: "h-2 w-2" },
  lg: { spinner: "h-8 w-8", dots: "gap-2", dot: "h-2.5 w-2.5" },
} as const;

export function Loader({
  variant = "spinner",
  size = "md",
  label = "Loading",
  className,
}: LoaderProps) {
  const sizes = sizeStyles[size];

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "inline-block text-neutral-500 dark:text-neutral-400",
          className,
        )}
        role="status"
        aria-label={label}
      >
        <span className={cn("block", spinnerStyles, sizes.spinner)} />
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn("flex items-center", sizes.dots, className)}
        role="status"
        aria-label={label}
      >
        <span
          className={cn(
            "rounded-full bg-current text-neutral-500 dark:text-neutral-400",
            sizes.dot,
            "animate-bounce",
          )}
          style={{ animationDelay: "0ms" }}
        />
        <span
          className={cn(
            "rounded-full bg-current text-neutral-500 dark:text-neutral-400",
            sizes.dot,
            "animate-bounce",
          )}
          style={{ animationDelay: "150ms" }}
        />
        <span
          className={cn(
            "rounded-full bg-current text-neutral-500 dark:text-neutral-400",
            sizes.dot,
            "animate-bounce",
          )}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    );
  }

  // pulse: single pulsing circle
  return (
    <div
      className={cn(
        "inline-block text-neutral-500 dark:text-neutral-400",
        className,
      )}
      role="status"
      aria-label={label}
    >
      <span
        className={cn(
          "block rounded-full bg-current animate-pulse",
          sizes.spinner,
        )}
      />
    </div>
  );
}
