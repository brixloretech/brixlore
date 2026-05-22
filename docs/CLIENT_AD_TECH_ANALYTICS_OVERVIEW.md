# Client Overview: TargetVideo, Ad Butler, Mux, and Matomo

## 1. Stack Summary
This setup uses four tools with clear responsibilities:

- TargetVideo: video playback and in-player ad execution
- Ad Butler: central ad serving and campaign control
- Mux Data: video quality and engagement analytics
- Matomo: website/app traffic, user journey, and conversion analytics

This is a strong setup when each tool is used for its own purpose.

---

## 2. What Each Tool Does

### TargetVideo Player
- Plays video content on web and app
- Supports pre-roll, mid-roll, post-roll, and outstream/overlay formats
- Handles player-level events (play, pause, complete, etc.)
- Supports adaptive streaming workflows for smoother playback across different network conditions
- Provides player-side controls and hooks for custom UI, playlist behavior, and playback logic
- Works as the execution layer for video ad breaks while keeping content playback stable

### Ad Butler
- Main ad server for site and app inventory
- Manages campaigns, targeting, frequency capping, and rotation
- Provides ad tags for video slots and non-video placements
- Centralizes ad decisioning so the same business rules apply across pages, screens, and player slots
- Helps avoid ad duplication by controlling delivery logic and frequency at one place
- Improves monetization operations with clearer campaign management and inventory utilization

### Mux Data
- Focused on video analytics
- Tracks startup time, buffering, bitrate, playback errors, and drop-off
- Helps improve streaming quality and viewer experience
- Surfaces Quality of Experience (QoE) signals that show why viewers leave or fail to complete videos
- Breaks down performance by device, OS, browser, and geography for troubleshooting at scale
- Helps engineering teams prioritize fixes that directly improve watch time and completion rate

### Matomo
- Focused on business/product analytics
- Tracks sessions, traffic, behavior, funnels, goals, and conversions
- Helps understand user journey and marketing performance
- Connects acquisition sources to downstream actions like signup, plan selection, and purchase
- Supports event-based analysis across web and app flows to identify conversion bottlenecks
- Complements video analytics by showing product impact, not just playback quality

---

## 3. Mux vs Matomo (Simple Difference)

- Mux answers: "How well are videos playing?"
- Matomo answers: "How are users moving through the product and converting?"

They can both show geo/device data, but they are not the same product.

---

## 4. Integration Flow

1. Ad Butler decides which ad should be served.
2. TargetVideo requests ads from Ad Butler for video slots.
3. TargetVideo plays those ads in pre/mid/post/outstream positions.
4. Mux receives video quality and engagement events.
5. Matomo receives business and conversion events.

Result:
- Unified ad control
- Clear video-performance visibility
- Clear business/conversion visibility

---

## 5. Ad Placement Model

### In-player placements (TargetVideo using Ad Butler tags)
- Pre-roll: before video starts
- Mid-roll: during playback
- Post-roll: after video ends
- Outstream/overlay card: in or around player experience

### Non-video placements (Ad Butler)
- Homepage banners
- In-article display placements
- Sidebar/in-feed placements
- App placements outside the player

Best practice:
- Keep Ad Butler as the single ad-serving source.
- Do not mix unrelated direct VAST sources in TargetVideo unless used as emergency failover.

---

## 6. Recommended Implementation

1. Create Ad Butler tags for all video slots.
2. Configure TargetVideo to use those Ad Butler tags.
3. Enable Mux Data on player sessions.
4. Track core events in Matomo:
   - video_start
   - video_complete
   - ad_impression
   - ad_click
   - signup
   - purchase
5. Use a shared user ID strategy across player, ad server, and analytics.

---

## 7. Final Recommendation

This is a complete and scalable stack for a video-first product.

- TargetVideo: playback and in-player monetization
- Ad Butler: ad operations and placement control
- Mux: video QoE and engagement insights
- Matomo: user journey and conversion reporting

Use all four together with clear ownership, and reporting will stay clean and understandable for business and technical teams.
