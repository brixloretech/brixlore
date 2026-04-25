// "use client";

// import { useEffect, useRef, useState } from "react";

// // Proper types for YouTube IFrame API
// type YTPlayer = {
//   destroy: () => void;
//   seekTo: (seconds: number) => void;
//   playVideo: () => void;
// };

// type YTPlayerEvent = {
//   data: number;
// };

// type YTWindow = {
//   YT?: {
//     Player: new (
//       elementId: string,
//       options: {
//         videoId: string;
//         playerVars: Record<string, number>;
//         events: {
//           onStateChange: (e: YTPlayerEvent) => void;
//         };
//       },
//     ) => YTPlayer;
//   };
//   onYouTubeIframeAPIReady?: () => void;
// };

// type HeroVideoProps = {
//   uploadedSrc?: string | null;
//   youtubeId: string;
// };

// export function HeroVideo({ uploadedSrc, youtubeId }: HeroVideoProps) {
//   const [mounted, setMounted] = useState(false);
//   const playerRef = useRef<YTPlayer | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setMounted(true), 300);
//     return () => clearTimeout(timer);
//   }, []);

//   useEffect(() => {
//     if (!mounted || uploadedSrc) return;

//     const win = window as unknown as YTWindow;

//     const initPlayer = () => {
//       if (playerRef.current) {
//         playerRef.current.destroy();
//         playerRef.current = null;
//       }

//       if (!win.YT?.Player) return;

//       playerRef.current = new win.YT.Player("hero-yt-player", {
//         videoId: youtubeId,
//         playerVars: {
//           autoplay: 1,
//           mute: 1,
//           controls: 0,
//           showinfo: 0,
//           modestbranding: 1,
//           rel: 0,
//           playsinline: 1,
//         },
//         events: {
//           onStateChange: (e: YTPlayerEvent) => {
//             // YT.PlayerState.ENDED = 0
//             if (e.data === 0) {
//               playerRef.current?.seekTo(0);
//               playerRef.current?.playVideo();
//             }
//           },
//         },
//       });
//     };

//     // Case 1: API already loaded (navigated back to page)
//     if (win.YT?.Player) {
//       initPlayer();
//       return;
//     }

//     // Case 2: Script tag already injected, just waiting for it
//     if (
//       document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
//     ) {
//       win.onYouTubeIframeAPIReady = initPlayer;
//       return;
//     }

//     // Case 3: First load — inject the script
//     const tag = document.createElement("script");
//     tag.src = "https://www.youtube.com/iframe_api";
//     document.head.appendChild(tag);
//     win.onYouTubeIframeAPIReady = initPlayer;

//     return () => {
//       playerRef.current?.destroy();
//       playerRef.current = null;
//     };
//   }, [mounted, uploadedSrc, youtubeId]);

//   if (uploadedSrc) {
//     return (
//       <video
//         autoPlay
//         muted
//         loop
//         playsInline
//         className="absolute inset-0 h-full w-full object-cover"
//         src={uploadedSrc}
//       />
//     );
//   }

//   if (!mounted) return null;

//   return (
//     <div
//       ref={containerRef}
//       className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
//     >
//       <div id="hero-yt-player" className="h-full w-full" />
//     </div>
//   );
// }
"use client";

type HeroVideoProps = {
  uploadedSrc?: string | null;
};

export function HeroVideo({ uploadedSrc }: HeroVideoProps) {
  if (!uploadedSrc) return null;

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
