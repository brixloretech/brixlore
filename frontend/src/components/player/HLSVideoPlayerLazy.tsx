"use client";

import dynamic from "next/dynamic";
import { PlayerSkeleton } from "./PlayerSkeleton";
import type { HLSVideoPlayerProps } from "./HLSVideoPlayer";

/**
 * Lazy-loaded HLS player. Keeps Video.js out of the initial bundle and loads
 * only when the watch page is rendered, for faster FCP and smooth playback.
 */
export const HLSVideoPlayerLazy = dynamic<HLSVideoPlayerProps>(
  () => import("./HLSVideoPlayer").then((mod) => mod.HLSVideoPlayer),
  {
    ssr: false,
    loading: () => <PlayerSkeleton />,
  },
);
