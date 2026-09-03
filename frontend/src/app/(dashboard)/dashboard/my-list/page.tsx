"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bookmark, Play, Plus, X } from "lucide-react";
import { Loader } from "@/components/ui";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";
import { useMyList } from "@/contexts";
import { contentService } from "@/lib/services";
import type { ContentSummaryDto } from "@/types/api";
import { RainbowButton } from "@/components/ui/rainbow-button";

function SavedPoster({
  item,
  index,
  onRemove,
}: {
  item: ContentSummaryDto;
  index: number;
  onRemove: () => void;
}) {
  const image = item.posterUrl || item.thumbnailUrl;
  return (
    <article className="group relative">
      <span className="pointer-events-none absolute -left-2 bottom-[38px] z-20 select-none text-7xl font-semibold leading-none tracking-[-0.11em] text-white mix-blend-difference sm:text-8xl">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Link
        href={`/watch-2/${item.id}`}
        className="relative ml-7 block h-[290px] overflow-hidden rounded-[3px] bg-white/10 sm:h-[360px] xl:h-[410px]"
      >
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(145deg,#353535,#080808)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-4 left-4 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Play size={16} fill="currentColor" />
        </span>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.title} from My List`}
        className="absolute right-2 top-2 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white opacity-0 backdrop-blur transition hover:bg-white hover:text-black group-hover:opacity-100"
      >
        <X size={15} />
      </button>
      <div className="ml-7 mt-3">
        <h2 className="truncate text-sm font-semibold tracking-[-0.025em]">
          {item.title}
        </h2>
        <p className="mt-1 text-xs text-white/45">
          {item.releaseYear} <span className="mx-1">/</span>{" "}
          {item.category || item.type}
        </p>
      </div>
    </article>
  );
}

export default function MyListPage() {
  const { listIds, remove } = useMyList();
  const [savedItems, setSavedItems] = useState<ContentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!listIds.length) {
      setSavedItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void contentService
      .getContentForBrowse()
      .then((catalog) => {
        if (!active) return;
        const byId = new Map(catalog.map((item) => [item.id, item]));
        setSavedItems(
          listIds
            .map((id) => byId.get(id))
            .filter((item): item is ContentSummaryDto => Boolean(item)),
        );
      })
      .catch(() => {
        if (active) setSavedItems([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [listIds]);

  const feature = savedItems[0];
  const featureImage =
    feature?.bannerUrl || feature?.thumbnailUrl || feature?.posterUrl;
  const categories = useMemo(
    () =>
      Array.from(
        new Set(savedItems.map((item) => item.category || item.type)),
      ).slice(0, 4),
    [savedItems],
  );

  if (isLoading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Opening your vault…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <section className="relative isolate min-h-[550px] overflow-hidden border-b border-white/15 sm:min-h-[620px]">
        {featureImage && (
          <img
            src={featureImage}
            alt=""
            className="absolute inset-0 -z-30 h-full w-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.9)_47%,rgba(5,5,5,0.25)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-20 h-2/3 bg-gradient-to-t from-[#050505] to-transparent" />
        <p
          aria-hidden="true"
          className="pointer-events-none absolute right-[-0.08em] top-[12%] hidden select-none text-[19vw] font-semibold leading-none tracking-[-0.13em] text-white/[0.045] lg:block"
        >
          VAULT
        </p>
        <div className="relative mx-auto flex min-h-[550px] max-w-[1550px] items-end px-4 pb-14 pt-24 sm:min-h-[620px] sm:px-6 lg:px-10 lg:pb-20">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
              <Bookmark size={13} /> Personal archive{" "}
              <span className="h-px w-10 bg-white/40" />{" "}
              {String(savedItems.length).padStart(2, "0")} saved
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.85] tracking-[-0.08em] sm:text-7xl lg:text-[88px]">
              Keep what
              <br />
              moves <span className="text-white/40">you.</span>
            </h1>
            <p className="mt-7 max-w-md border-l border-white/45 pl-5 text-sm leading-7 text-white/65 sm:text-base">
              A private collection of the stories worth returning to. Your
              personal Brixlore vault, ready whenever you are.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={feature ? `/watch-2/${feature.id}` : "/dashboard/explore"}
                className="inline-flex "
              >
                <RainbowButton>
                  <Play size={16} fill="currentColor" />{" "}
                  {feature ? "Play first saved" : "Start collecting"}
                </RainbowButton>
              </Link>
              <Link href="/dashboard/explore" className="inline-flex ">
                <RainbowButton className="text-white" variant="outline">
                  <Plus size={17} /> Add a title
                </RainbowButton>
              </Link>
            </div>
          </div>
          <div className="absolute right-4 bottom-14 hidden w-[250px] border-l border-white/25 pl-5 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              Archive status
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
              {savedItems.length
                ? "Growing beautifully."
                : "Ready for its first story."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category}
                  className="border border-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/60"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
      <ScrollVelocityContainer className="border-b border-white/10 bg-white py-4 text-black">
        <ScrollVelocityRow
          baseVelocity={1.3}
          direction={-1}
          scrollReactivity={false}
          className="text-sm font-bold uppercase tracking-[0.18em]"
        >
          <span className="mx-6">Your saved stories</span>
          <span className="text-black/35">✦</span>
          <span className="mx-6">Built for the right moment</span>
          <span className="text-black/35">✦</span>
          <span className="mx-6">The Brixlore vault</span>
          <span className="text-black/35">✦</span>
        </ScrollVelocityRow>
      </ScrollVelocityContainer>
      <div className="mx-auto w-full max-w-[1550px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Selected by you
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
              Inside the vault
            </h2>
          </div>
          <p className="font-mono text-xs text-white/45">
            {String(savedItems.length).padStart(2, "0")} TITLES
          </p>
        </div>
        {savedItems.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {savedItems.map((item, index) => (
              <SavedPoster
                key={item.id}
                item={item}
                index={index}
                onRemove={() => remove(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="relative grid min-h-[420px] place-items-center overflow-hidden border border-dashed border-white/15 bg-white/[0.02] px-6 text-center">
            <p
              aria-hidden="true"
              className="pointer-events-none absolute right-[-0.04em] bottom-[-0.23em] select-none text-9xl font-semibold tracking-[-0.12em] text-white/[0.035]"
            >
              YOURS
            </p>
            <div className="relative">
              <Bookmark size={30} className="mx-auto text-white/45" />
              <h3 className="mt-6 text-3xl font-semibold tracking-[-0.06em]">
                Nothing in the vault. Yet.
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/55">
                When a story stays with you, save it. Your first favorite is
                waiting somewhere in the catalog.
              </p>
              <Link
                href="/dashboard/explore"
                className="mt-7 inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-bold text-black"
              >
                Explore the signal <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
