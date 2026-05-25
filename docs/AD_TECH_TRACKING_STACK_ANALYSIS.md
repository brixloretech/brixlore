# Ad Tech + Tracking Stack (Short Version)

## Quick Answer
Your stack is good and mostly complete.

- TargetVideo + Ad Butler = ad delivery
- Mux Data + Matomo = analytics
- Mux and Matomo are NOT the same

---

## What Each Tool Does

### TargetVideo
- Plays video in web/app
- Runs pre-roll, mid-roll, outstream/overlay video ads
- Handles video player events

### Ad Butler
- Central ad server for full site/app
- Controls ad campaigns, targeting, frequency caps
- Should provide ad tags for TargetVideo video slots

### Mux Data
- Video analytics only
- Tracks buffering, bitrate, startup time, watch drop-off, video QoE
- Gives video-viewer geo/device insights

### Matomo
- Full product analytics (web + app)
- Tracks page/screen views, funnels, sessions, goals, conversions
- Gives overall traffic, geo, and behavior insights

---

## Mux vs Matomo (Simple)

| Question | Use |
|---|---|
| "Is video playback quality good?" | Mux Data |
| "Where are video viewers coming from?" | Mux Data |
| "How are users moving through app/site?" | Matomo |
| "What converts (signup/payment)?" | Matomo |

They overlap a little on geo/device, but purpose is different.

---

## Will This Stack Work Together?

Yes, if integrated correctly:

1. Ad Butler is the source of ad decisioning.
2. TargetVideo pulls video ads from Ad Butler tags.
3. Mux handles video quality analytics.
4. Matomo handles business/product analytics.
5. Important events are shared into Matomo for funnel reporting.

---

## What Is Missing Right Now

- Unified user ID across web + app + player + ads
- Ad-to-conversion attribution (which ad led to signup/purchase)
- One dashboard view combining ad + video + product KPIs
- Confirm Mux tracking coverage for your React Native flow

---

## Minimum Setup Plan

### Phase 1
- Configure TargetVideo ad slots with Ad Butler tags
- Install Matomo tracking on web and mobile app
- Enable Mux Data for video sessions

### Phase 2
- Add unified user ID into all 4 systems
- Send key video events to Matomo:
  - video_start
  - video_complete
  - ad_impression
  - ad_click

### Phase 3
- Build funnel report in Matomo:
  - ad_impression -> video_start -> video_complete -> conversion
- QA counts between Ad Butler, TargetVideo, Mux, and Matomo

---

## Final Recommendation

Keep this stack.

- Do NOT replace tools.
- Do integration cleanup.
- Use Mux for video quality decisions.
- Use Matomo for product and conversion decisions.

That gives you clear reporting without tool overlap confusion.
