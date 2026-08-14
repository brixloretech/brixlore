"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type Movie = { title: string; type: string; image: string };

export function MovieCarousel({ movies }: { movies: Movie[] }) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const update = useCallback(
    () => setSelected(emblaApi?.selectedScrollSnap() ?? 0),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    setSnapCount(emblaApi.scrollSnapList().length);
    update();
    emblaApi.on("select", update).on("reInit", update);
    return () => {
      emblaApi.off("select", update).off("reInit", update);
    };
  }, [emblaApi, update]);

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-8">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex touch-pan-y gap-2">
          {movies.map((movie) => (
            <article
              key={movie.title}
              className="group min-w-0 flex-[0_0_calc((100%_-_1rem)/2.5)] overflow-hidden rounded-[16px] shadow-2xl transition-colors duration-300 sm:flex-[0_0_calc((100%_-_1rem)/3)] lg:flex-[0_0_calc((100%_-_3rem)/4)]"
            >
              <div className="relative aspect-[2/3]">
                <Image
                  src={movie.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent transition-colors duration-300 " />
                <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/80 transition-colors group-hover:border-white/40 group-hover:bg-white/15">
                  {movie.type}
                </span>
              </div>
              <h3 className="px-4 py-3 text-sm font-semibold text-white transition-colors ">
                {movie.title}
              </h3>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        {Array.from({ length: snapCount }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Go to movie slide ${index + 1}`}
            className={`h-1.5 rounded-full ${index === selected ? "w-6 bg-white" : "w-1.5 bg-white/30"}`}
          />
        ))}
      </div>

      {/* section of Get More with Premium */}

      
    </div>
  );
}
