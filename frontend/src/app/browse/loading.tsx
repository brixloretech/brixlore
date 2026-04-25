import { cn } from "@/lib/utils";

function PosterCardSkeleton() {
  return (
    <div
      className={cn(
        "h-40 w-72 shrink-0 animate-pulse rounded-xl bg-white/10 sm:h-44 sm:w-80",
      )}
      aria-hidden
    />
  );
}

function BannerSkeleton() {
  return (
    <div
      className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10"
      style={{ height: "clamp(18rem, 40vw, 28rem)" }}
    >
      <div
        className="h-full w-full animate-pulse rounded-xl bg-white/10"
        aria-hidden
      />
    </div>
  );
}

export default function BrowseLoading() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0b0b0e] text-white">
      <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-500/20 blur-[140px]" />

      <section className="px-4 pt-6 sm:px-6 lg:px-10">
        <div className="reveal">
          <div className="mb-6">
            <div className="h-3 w-24 animate-pulse rounded bg-white/20" />
            <div className="mt-2 h-9 w-64 animate-pulse rounded bg-white/20 sm:h-10 sm:w-80" />
            <div className="mt-2 h-4 max-w-xl animate-pulse rounded bg-white/10" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-20 animate-pulse rounded-full bg-white/10"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10">
        <BannerSkeleton />
      </div>

      <section className="mt-10 space-y-10 px-4 pb-12 sm:px-6 lg:px-10">
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <div className="h-7 w-32 animate-pulse rounded bg-white/20 sm:h-8" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <PosterCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
