# Tech Stack Feasibility: Video.js + Cloudflare Stream + AdButler + Matomo + Mux

## Goal
Build a custom, white-label web video player that:
- streams high-quality video,
- plays geo-targeted ads,
- tracks audience behavior and location trends,
- supports custom interactive cards.

Status: This is feasible.

## 1. Video Storage and Delivery (Cloudflare Stream)
Cloudflare Stream can be used with a custom player.

- Setup: Upload source videos to Cloudflare Stream.
- Playback in own player: Use HLS or DASH manifest URL.
- Recommended HLS format from Cloudflare docs:
	- `https://customer-<CODE>.cloudflarestream.com/<UID>/manifest/video.m3u8`
- White-label approach: Use your own player UI (Video.js) and custom domain strategy where possible.

Feasibility: Yes.

## 2. Video Player Layer (Video.js)
Video.js is a strong choice for a custom, unbranded player experience.

- Open-source and fully themeable with CSS.
- Supports custom controls, layout, and full-screen behavior.
- Can load HLS streams from Cloudflare Stream.
- Easy to extend with plugins and custom overlays.

Feasibility: Yes.

## 3. Ads (AdButler with Video.js)
AdButler can serve video and display ads in this setup.

- Use Video.js ad plugin flow (commonly `videojs-contrib-ads` plus a VAST-compatible integration).
- AdButler VAST tags can power:
	- pre-roll,
	- mid-roll,
	- post-roll,
	- outstream/overlay-style video ad units (implementation-dependent).
- Geo-targeting remains controlled in AdButler campaign rules.

Runtime behavior:
- User starts content.
- Player requests ad from AdButler VAST tag.
- Matching ad returns based on campaign targeting (including geo if configured).
- Ad plays, then content resumes.

Feasibility: Yes.

## 4. Analytics and Mapping (Matomo)
Matomo can still be your main product analytics and location map tool.

- Install Matomo tracking script.
- Add Matomo Media Analytics for video behavior tracking.
- Track key events such as play, pause, complete, ad click, card click.
- Use Matomo geo and behavior reports for real-time and historical analysis.

Feasibility: Yes.

## 5. Mux Data with Video.js (Important)
Yes, Mux still works with Video.js.

- Mux provides a dedicated Video.js integration (`videojs-mux`).
- It tracks QoE metrics such as:
	- startup time,
	- buffering,
	- bitrate/rendition changes,
	- playback failures,
	- request/network metrics.
- Mux docs also mention ad metrics support when using compatible ad integrations.

Minimum setup concept:
- Install `videojs-mux`.
- Initialize Mux plugin in Video.js with `env_key`.
- Pass metadata: `video_id`, `video_title`, `viewer_user_id`, `player_name`, etc.

Feasibility: Yes, fully compatible.

## 6. Custom Interactive Cards
Custom cards are feasible with Video.js overlays.

- Build overlay container inside player boundary.
- Trigger cards based on playback time.
- Support full-screen responsiveness.
- Optional behavior: pause video when user opens card and resume on close.

Feasibility: Yes.

## 7. Recommended Custom Settings

### Player settings
- Custom skin and control bar.
- Adaptive playback defaults tuned for mobile-first behavior.
- Error UI with retry and fallback messaging.

### Ad settings
- Centralize all ad decisioning in AdButler.
- Define frequency caps in AdButler (single source of truth).
- Use fallback ad tag only for ad-fill failure scenarios.

### Analytics settings
- Mux for QoE (video performance).
- Matomo for journey/conversion (business analytics).
- Use shared `viewer_user_id` strategy across systems for clean attribution.

### Privacy settings
- Respect consent state before loading tracking where required.
- Consider Mux options like `disableCookies` or `respectDoNotTrack` if policy requires.

## 8. Risks and Corrections

- White-label expectation: You can hide player branding, but hosting/network origins can still be visible at request level.
- Ad latency target: "under 0.5 sec" is very aggressive; define a practical SLA (for example p95 target) after testing real regions/devices.
- Plugin compatibility: lock tested versions of Video.js + ad plugins + Mux plugin before production.
- Geo targeting quality depends on ad server targeting data and policy setup in AdButler.

## 9. Launch Checklist

- [ ] Cloudflare Stream manifest playback works on desktop/mobile.
- [ ] Video.js theme is fully branded and white-label.
- [ ] Pre/mid/post ad breaks play from AdButler VAST tags.
- [ ] Frequency capping and geo targeting validated with test campaigns.
- [ ] Mux dashboard shows startup, buffering, errors, and engagement metrics.
- [ ] Matomo shows video + card events and geo reports.
- [ ] Interactive cards render correctly in normal and full-screen modes.
- [ ] Consent and privacy behavior validated.

## 10. Admin Panel Screens (Important for Video.js)
Yes, admin panel screens are needed for this setup.

Reason:
- Video.js gives flexibility, but you need a central place to control mappings, schedules, analytics health, and custom card behavior.

### Must-have screens

### A) Player Configuration
- Default player behavior (autoplay policy, controls, poster, playback defaults)
- Theme and branding settings (logo, colors, control bar options)
- Stream source profile selection (HLS/DASH, fallback behavior)

Why important for Video.js:
- Video.js is highly customizable, so ops teams need safe controls without code deploys for every small change.

### B) Ad Slot Mapping (AdButler -> Video.js)
- Map AdButler tags to pre-roll, mid-roll, post-roll, outstream
- Mid-roll rules editor (timestamps or cue points)
- Placement-level on/off toggles and fallback tags

Why important for Video.js:
- Ad plugin wiring and slot timing are player-level concerns; this screen prevents manual code edits for campaign changes.

### C) Interactive Cards Manager
- Create/edit card templates (text, CTA, image)
- Time-coded triggers by video ID
- Display rules (pause on open, auto-close timer, full-screen behavior)

Why important for Video.js:
- Custom cards are a core product feature and should be managed by content/ad teams, not only developers.

### D) Analytics and QoE Overview
- Mux KPIs: startup time, rebuffer ratio, error rate, completion trend
- Matomo KPIs: sessions, funnel progression, conversions, geo trends
- Combined filters by video, device, region, and date

Why important for Video.js:
- You need one operational view across playback quality and business outcomes.

### E) Event Health and Debug
- Last successful event sync for Mux and Matomo
- Failed ad requests, VAST errors, playback errors, card trigger errors
- Retry/replay for failed webhook or event jobs

Why important for Video.js:
- Plugin-based stacks can fail silently without centralized monitoring.

### F) Roles, Audit, and Privacy
- Roles: Admin, Ad Ops, Analyst, Content Manager, Viewer
- Audit log for mapping/config edits
- Consent controls affecting Mux/Matomo tracking behavior

Why important for Video.js:
- Multiple teams touch player, ads, and tracking; controlled permissions reduce risk.

### Nice-to-have screens
- Alert Center (QoE spike, ad fill drop, tracking outage)
- Revenue Snapshot by placement and geo
- A/B Experiment screen for player themes and card variants

### What not to build
- Do not rebuild full AdButler campaign manager
- Do not rebuild full Mux deep analytics explorer
- Do not rebuild full Matomo reporting suite

Use internal admin for orchestration and quick operations; keep deep workflows in vendor tools.

## Final Recommendation
Move forward with Video.js stack.

- It satisfies custom branding and control requirements.
- It supports AdButler monetization patterns.
- It supports Matomo business analytics.
- It supports Mux QoE analytics with a dedicated Video.js integration.
