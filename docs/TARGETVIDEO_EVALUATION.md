# Client Brief: TargetVideo + Ad Butler + Mux + Matomo

## 1. What Each Platform Does

### TargetVideo
- Video player for web and mobile apps
- Plays content with pre-roll, mid-roll, post-roll, and outstream ads
- Handles playback, video events, and player controls

### Ad Butler
- Central ad server for the full website and app
- Manages campaigns, targeting, ad rotation, and frequency caps
- Serves ads to both video slots and non-video slots

### Mux Data
- Video analytics platform
- Measures playback quality: startup time, buffering, bitrate, errors, watch drop-off
- Useful for video QoE and viewer geo/device insights

### Matomo
- Product and marketing analytics platform
- Measures traffic, sessions, funnels, goals, and conversions
- Useful for full user journey across web and app

---

## 2. Mux and Matomo: Same or Different?

They are different.

- Mux answers: "How is video playback quality and engagement?"
- Matomo answers: "How are users moving through the product and converting?"

Both can report geo/device data, but their main purpose is not the same.

---

## 3. Integration Model (Simple)

1. Ad Butler is the ad decisioning layer.
2. TargetVideo player requests video ads from Ad Butler tags.
3. TargetVideo plays the ad in the correct slot.
4. Mux receives video playback quality events.
5. Matomo receives business events and conversion events.

Outcome:
- One ad-control system
- One video-quality analytics system
- One product/conversion analytics system

---

## 4. Ad Placement: Ad Butler to TargetVideo

### Video placements inside TargetVideo player
- Pre-roll: before video starts
- Mid-roll: during video
- Post-roll: after video ends
- Outstream/overlay card: on/near player experience

### Non-video placements via Ad Butler
- Homepage banners
- In-article display units
- Sidebar or in-feed placements
- App screen placements outside the video player

Important rule:
- Keep Ad Butler as the single source for ad serving and frequency capping.
- TargetVideo should not use separate direct ad sources unless failover is required.

---

## 5. Feature Summary

### TargetVideo + Ad Butler
- Video monetization across web and app
- Central campaign control and ad placement management
- Cleaner reporting for ad delivery and inventory usage

### Mux + Matomo
- Better video quality monitoring (Mux)
- Better funnel and conversion tracking (Matomo)
- Together they provide technical and business visibility

---

## 6. Recommended Setup

1. Configure Ad Butler tags for pre-roll, mid-roll, post-roll, and outstream.
2. Connect those tags in TargetVideo player configuration.
3. Enable Mux Data on player sessions for QoE tracking.
4. Track key product events in Matomo: video_start, video_complete, ad_impression, ad_click, signup, purchase.
5. Use a shared user ID strategy across player, ad server, and analytics tools.
6. Validate reporting weekly: ad counts, video quality, and conversion funnel.

---

## 7. Final Recommendation

This is a strong stack for a video-first product.

- TargetVideo = playback and in-player ad execution
- Ad Butler = ad serving and placement control
- Mux = video quality and engagement analytics
- Matomo = full customer journey and conversion analytics

Use all four together with clear responsibilities and one integration flow.
