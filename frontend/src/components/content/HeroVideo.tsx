"use client";

import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  uploadedSrc?: string | null;
  youtubeSrc: string;
  youtubeId: string; // pass the raw video ID e.g. "TEjHDF9QXTY"
};

export function HeroVideo({
  uploadedSrc,
  youtubeSrc,
  youtubeId,
}: HeroVideoProps) {
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || uploadedSrc) return;

    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player("hero-yt-player", {
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: any) => {
            // YT.PlayerState.ENDED = 0
            if (e.data === 0) {
              playerRef.current?.seekTo(0);
              playerRef.current?.playVideo();
            }
          },
        },
      });
    };

    return () => {
      playerRef.current?.destroy();
    };
  }, [mounted, uploadedSrc, youtubeId]);

  if (uploadedSrc) {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={uploadedSrc}
      />
    );
  }

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
    >
      <div id="hero-yt-player" className="h-full w-full" />
    </div>
  );
}
