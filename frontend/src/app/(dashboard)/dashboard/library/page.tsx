"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Loader } from "@/components/ui";
import { contentService } from "@/lib/services";
import type { ContentSummaryDto } from "@/types/api";

export default function LibraryPage() {
  const [libraryItems, setLibraryItems] = useState<ContentSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    contentService
      .getContentForBrowse()
      .then((items) => {
        if (!active) return;
        setLibraryItems(items.slice(0, 8));
      })
      .catch(() => {
        if (!active) return;
        setLibraryItems([]);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasLibrary = libraryItems.length > 0;
  if (isLoading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4 py-12">
        <Loader size="lg" label="Loading library…" />
      </main>
    );
  }
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Library
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Saved and watched content will appear here.
        </p>
      </header>

      {hasLibrary ? (
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Library content"
        >
          {libraryItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-4"
            >
              <div className="relative h-28 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800/70 via-neutral-900 to-neutral-800/50">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <p className="mt-4 text-sm font-semibold text-white">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {item.category ?? item.type}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <section
          className="rounded-xl border border-neutral-700/50 bg-neutral-900/50 p-8 text-center sm:p-12"
          aria-label="Library content"
        >
          <span className="text-5xl text-neutral-600" aria-hidden>
            📚
          </span>
          <p className="mt-4 text-lg font-medium text-white">
            Your library is empty
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-400">
            Videos you save or watch will show up here for quick access.
          </p>
          <Link href="/browse" className="mt-6 inline-block">
            <Button type="button">Browse content</Button>
          </Link>
        </section>
      )}
    </>
  );
}
