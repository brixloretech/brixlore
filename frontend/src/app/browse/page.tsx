import Link from "next/link";
import { cn } from "@/lib/utils";
import { contentService } from "@/lib/services/content.service";
import type { ContentSummaryDto } from "@/types/api";
import type { ContentType } from "@/types/api";
import {
  BrowsePosterCard,
  NewlyUploadedBannerCarousel,
} from "@/components/content";

type BrowseItem = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  size?: "poster" | "wide";
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
};

type BrowseRow = {
  id: string;
  title: string;
  subtitle?: string;
  items: BrowseItem[];
  accent?: "amber" | "violet" | "cyan" | "rose";
};

/** Display order and labels for content types (movies, series, documentaries, etc.) */
const CONTENT_TYPE_ORDER: ContentType[] = [
  "MOVIE",
  "SERIES",
  "DOCUMENTARY",
  "ANIMATION",
  "TRAILER",
  "SHORT",
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  MOVIE: "Movies",
  SERIES: "Series",
  DOCUMENTARY: "Documentaries",
  ANIMATION: "Animation",
  TRAILER: "Trailers",
  SHORT: "Shorts",
};

const ACCENTS: BrowseRow["accent"][] = ["amber", "violet", "cyan", "rose"];

function formatSubtitle(item: ContentSummaryDto): string | undefined {
  const parts: string[] = [];
  if (item.releaseYear) parts.push(String(item.releaseYear));
  if (item.ageRating) parts.push(item.ageRating);
  const subtitle = parts.join(" • ");
  return subtitle.length > 0 ? subtitle : undefined;
}

function toBrowseItem(item: ContentSummaryDto): BrowseItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: formatSubtitle(item),
    thumbnailUrl: item.thumbnailUrl ?? null,
    bannerUrl: item.bannerUrl ?? null,
  };
}

function slugifyRowId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug.length > 0 ? slug : "featured";
}

/** Group content by type (MOVIE, SERIES, DOCUMENTARY, etc.) and build rows with display labels. */
function buildRowsByType(items: ContentSummaryDto[]): BrowseRow[] {
  const grouped = new Map<ContentType, ContentSummaryDto[]>();
  for (const item of items) {
    const type = (item.type?.trim().toUpperCase() || "MOVIE") as ContentType;
    const existing = grouped.get(type);
    if (existing) existing.push(item);
    else grouped.set(type, [item]);
  }

  const rowKeys = CONTENT_TYPE_ORDER.filter((type) => grouped.has(type));

  return rowKeys
    .map((type, index) => ({
      id: slugifyRowId(CONTENT_TYPE_LABELS[type]),
      title: CONTENT_TYPE_LABELS[type],
      subtitle: `Top picks in ${CONTENT_TYPE_LABELS[type]}`,
      accent: ACCENTS[index % ACCENTS.length],
      items: (grouped.get(type) ?? []).map(toBrowseItem),
    }))
    .filter((row) => row.items.length > 0);
}

async function getBrowseData(
  selectedCategory?: string | null,
  searchQuery?: string | null,
): Promise<{
  rows: BrowseRow[];
  newestItems: BrowseItem[];
}> {
  try {
    const items = await contentService.getContentForBrowse(undefined, {
      cache: "no-store",
    });
    const newestItems = items.slice(0, 3).map(toBrowseItem);

    // Filter items by category if a category is selected
    let filteredItems = items;
    if (selectedCategory && selectedCategory.trim().toLowerCase() !== "all") {
      const categoryFilter = selectedCategory.trim();
      filteredItems = filteredItems.filter(
        (item) =>
          item.category?.trim().toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    // Filter items by search query if provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.title.toLowerCase().includes(query),
      );
    }

    // Build rows grouped by type (Movies, Series, etc.) from filtered items
    const rows = buildRowsByType(filteredItems);

    return {
      rows,
      newestItems,
    };
  } catch {
    return { rows: [], newestItems: [] };
  }
}

function AccentTag({
  accent,
  text,
}: {
  accent: BrowseRow["accent"];
  text: string;
}) {
  const styles = {
    amber: "bg-white/10 text-white/80 border-white/20",
    violet: "bg-white/10 text-white/80 border-white/20",
    cyan: "bg-white/10 text-white/80 border-white/20",
    rose: "bg-white/10 text-white/80 border-white/20",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]",
        accent ? styles[accent] : "border-neutral-700 text-neutral-300",
      )}
    >
      {text}
    </span>
  );
}

function BrowseRowSection({ row }: { row: BrowseRow }) {
  return (
    <section className="space-y-3" aria-labelledby={`row-${row.id}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2
              id={`row-${row.id}`}
              className="text-xl font-semibold text-white sm:text-2xl"
            >
              {row.title}
            </h2>
            {row.accent ? (
              <AccentTag accent={row.accent} text="Curated" />
            ) : null}
          </div>
          {row.subtitle ? (
            <p className="mt-1 text-sm text-white/60">{row.subtitle}</p>
          ) : null}
        </div>
        <Link
          href="/browse"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70 hover:text-white"
        >
          See all
        </Link>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {row.items.map((item, index) => (
          <BrowsePosterCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

type BrowsePageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

/** Always fetch fresh content so newly published items show without manual refresh. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { category: categoryParam, q: searchQueryParam } = await searchParams;
  const androidApkUrl =
    process.env.NEXT_PUBLIC_ANDROID_APK_URL || "/apk/brixlore-latest.apk";
  const selectedCategory =
    categoryParam && categoryParam.trim() ? categoryParam.trim() : null;
  const searchQuery =
    searchQueryParam && searchQueryParam.trim()
      ? searchQueryParam.trim()
      : null;
  const { rows, newestItems } = await getBrowseData(
    selectedCategory,
    searchQuery,
  );
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0b0b0e] text-white">
      <div className="pointer-events-none absolute -top-28 right-0 h-64 w-64 rounded-full bg-white/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-500/20 blur-[140px]" />

      <section className="px-4 pt-6 sm:px-6 lg:px-10">
        <div className="mb-5 rounded-2xl border border-neutral-700/80 bg-gradient-to-r from-neutral-900/95 via-[#121212] to-neutral-900/95 px-4 py-3 text-sm text-neutral-200 shadow-[0_16px_34px_rgba(0,0,0,0.35)] ">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-neutral-100">
              Download the app for a faster, smoother experience.
            </p>
            <a
              href={androidApkUrl}
              className="rounded-full border border-neutral-500/90 bg-neutral-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900 transition-colors hover:bg-white"
            >
              Download
            </a>
          </div>
        </div>
      </section>

      {/* Banner carousel: one of the 3 newest videos at a time, auto-slides */}
      {newestItems.length > 0 ? (
        <div className="mt-10">
          <NewlyUploadedBannerCarousel items={newestItems} />
        </div>
      ) : null}

      <section className="mt-10 space-y-10 px-4 pb-12 sm:px-6 lg:px-10">
        {rows.length > 0 ? (
          rows.map((row) => <BrowseRowSection key={row.id} row={row} />)
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No content is available yet. Check back soon.
          </div>
        )}
      </section>
    </main>
  );
}
