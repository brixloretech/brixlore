/**
 * Public HLS test stream URLs for development and demo.
 * Replace with your own stream URLs or API in production.
 */

/** Default public HLS test stream (Big Buck Bunny, adaptive, Mux). */
export const DEFAULT_HLS_TEST_STREAM =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

/** Alternative public HLS test streams. */
export const HLS_TEST_STREAMS: Record<string, string> = {
  "big-buck-bunny": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  "apple-fmp4":
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
  sintel: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
};
