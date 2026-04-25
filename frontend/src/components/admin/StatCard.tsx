import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  /** Optional trend text (e.g. "+12%") */
  trend?: string;
  /** Optional icon or emoji */
  icon?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-6 shadow-sm transition-shadow hover:shadow-md",
        "border-l-4 border-l-accent",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">
            {value}
          </p>
          {trend && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span aria-hidden>↑</span>
              {trend} vs last period
            </p>
          )}
        </div>
        {icon && (
          <span
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent/20 text-xl text-accent sm:text-2xl"
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
