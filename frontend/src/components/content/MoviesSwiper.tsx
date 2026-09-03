"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import Swiper from "swiper";
import { contentService } from "@/lib/services/content.service";
import type { ContentSummaryDto } from "@/types/api";
import { FigmaFavoriteButton } from "./FigmaFavoriteButton";

let contentRequest: Promise<ContentSummaryDto[]> | null = null;

function getContent() {
  contentRequest ??= contentService.getContentForBrowse(undefined, {
    cache: "no-store",
  });
  return contentRequest;
}

function getMoviesOptions(maxSlidesPerView: number) {
  const desktopSlides = Math.max(1, maxSlidesPerView);

  return {
  loop: true,
  slidesPerView: 2,
  spaceBetween: 25,
  breakpoints: {
    640: { slidesPerView: 2 },
    720: { slidesPerView: 3 },
    1024: { slidesPerView: Math.min(4, desktopSlides) },
    1280: { slidesPerView: Math.min(5, desktopSlides) },
    1536: { slidesPerView: desktopSlides },
  },
  };
}

function MovieCard({ item }: { item: ContentSummaryDto }) {
  const image = item.posterUrl || item.thumbnailUrl;
  const watchHref = `/watch-2/${item.id}`;

  return (
    <div className="swiper-slide">
      <div className="group text-center">
        <div className="relative mb-[20px] h-[330px] w-full overflow-hidden rounded-[5px] lg:mb-[22px]">
          <Link
            href={watchHref}
            className="block h-full overflow-hidden rounded-[5px]"
          >
            {image ? (
              <img
                src={image}
                className="h-full w-full rounded-[5px] object-cover transition-all duration-300 ease-in-out group-hover:scale-110"
                alt={item.title}
              />
            ) : (
              <div
                className="h-full w-full rounded-[5px] bg-white/10"
                aria-label={`${item.title} poster`}
              />
            )}
          </Link>
          <div className="flex items-center justify-center flex-wrap gap-[5px] absolute bottom-[10px] left-[15px] transform transition-all duration-300 ease-in-out opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:bottom-[20px]">
            {/* <button type="button" className="flex items-center justify-center text-white bg-white/30 rounded-full w-[30px] h-[30px] transition-all duration-300 ease-in-out hover:bg-primary hover:text-white"><i className="ri-heart-line" /></button> */}
            <FigmaFavoriteButton contentId={item.id} />
          </div>
          <Link
            href={watchHref}
            className="absolute top-1/2 left-1/2 transform bg-primary text-white text-3xl rounded-full w-[50px] h-[50px] flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-secondary hover:text-black opacity-0 invisible -mt-[20px] group-hover:opacity-100 group-hover:visible group-hover:-mt-[10px]"
            style={{ transform: "translate(-50%, -50%)" }}
            aria-label={`Play ${item.title}`}
          >
            <i className="ri-play-fill" />
          </Link>
        </div>
        <h5 className="text-base md:text-base lg:text-[18px] mb-[10px] md:mb-[12px] leading-none">
          <Link
            href={watchHref}
            className="transition-all duration-300 ease-in-out hover:text-secondary"
          >
            {item.title}
          </Link>
        </h5>
        <ul className="text-13 md:text-sm font-bold flex items-center justify-center flex-wrap gap-[13px] text-body/70">
          <li>{item.releaseYear || ""}</li>
          <li>
            <div className="w-px bg-white/20 h-[12px]" />
          </li>
          <li>
            <Link
              href="/browse"
              className="inline-block text-[#ae99fa] transition-all duration-300 ease-in-out hover:text-secondary"
            >
              {item.category || item.type}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

function LoadingCards({ maxSlidesPerView }: { maxSlidesPerView: number }) {
  const isRelated = maxSlidesPerView === 4;

  return (
    <div className="flex gap-[25px] overflow-hidden">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          className={`w-[calc((100%-25px)/2)] shrink-0 sm:w-[calc((100%-25px)/2)] md:w-[calc((100%-50px)/3)] lg:w-[calc((100%-75px)/4)] ${isRelated ? "xl:w-[calc((100%-75px)/4)] 2xl:w-[calc((100%-75px)/4)]" : "xl:w-[calc((100%-100px)/5)] 2xl:w-[calc((100%-125px)/6)]"}`}
          key={index}
        >
          <div className="group text-center">
            <div className="mb-[20px] h-[330px] w-full animate-pulse rounded-[5px] bg-white/10 lg:mb-[22px]" />
            <div className="mx-auto mb-[10px] h-6 w-3/4 animate-pulse rounded bg-white/10 md:mb-[12px]" />
            <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

type MoviesSwiperProps = {
  contentId?: string;
  slidesPerView?: number;
};

export default function MoviesSwiper({
  contentId: currentContentId,
  slidesPerView = 6,
}: PropsWithChildren<MoviesSwiperProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ContentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getContent(),
      currentContentId ? contentService.getContentById(currentContentId) : Promise.resolve(null),
    ])
      .then(([content, current]) => {
        const category = current?.content.category?.trim().toLowerCase();
        const related = content.filter((item) =>
          item.id !== currentContentId &&
          (!category || item.category?.trim().toLowerCase() === category),
        );
        if (active) setItems(related);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentContentId]);

  useEffect(() => {
    if (!containerRef.current || loading) return;
    const swiper = new Swiper(containerRef.current, getMoviesOptions(slidesPerView));
    return () => {
      swiper.destroy(true, true);
    };
  }, [loading, slidesPerView]);

  return (
    <div
      ref={containerRef}
      className={loading ? "w-full" : "swiper moviesSwiper"}
    >
      {loading ? (
        <LoadingCards maxSlidesPerView={slidesPerView} />
      ) : (
        <div className="swiper-wrapper">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
