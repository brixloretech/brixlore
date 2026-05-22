# 12-Day Implementation Timeline

## Scope
This timeline covers the Video.js stack without Mux:
- Cloudflare Stream for video storage and delivery
- Video.js for the player UI and custom overlays
- AdButler for video and display ads
- Matomo for tracking, funnels, and location reporting
- Admin panel screens for player, ads, analytics, and operations

---

## Day 1 - Requirements and Scope Freeze
- Confirm business goals and success metrics
- Finalize the player stack and ad stack
- Lock the ad placements: pre-roll, mid-roll, post-roll, outstream, banner
- Lock the first release admin screens

## Day 2 - Architecture and Data Flow Design
- Define the flow: Cloudflare Stream -> Video.js -> AdButler -> Matomo
- Define the shared user ID strategy
- Define staging and production environments
- Confirm what is in scope and what is not

## Day 3 - Credentials and Environment Setup
- Set up Cloudflare Stream access
- Set up AdButler tags and account access
- Set up Matomo tracking access
- Add staging environment variables and secrets

## Day 4 - Video.js Base Player
- Build the base Video.js player shell
- Connect Cloudflare Stream HLS/DASH playback
- Add custom branding, controls, and responsive behavior
- Verify desktop and mobile playback

## Day 5 - AdButler Video Integration
- Connect AdButler tags to the player
- Add pre-roll and mid-roll support first
- Add fallback behavior for ad failure
- Test ad start, ad end, and content resume

## Day 6 - Matomo Tracking Setup
- Install Matomo tracking on the web app
- Track player events: play, pause, complete, ad click, card click
- Track conversion events like signup and purchase
- Validate geo and traffic reports

## Day 7 - Custom Interactive Cards
- Build the custom cards layer inside the player
- Add time-based triggers for cards
- Add pause/resume behavior when cards open
- Test full-screen and mobile rendering

## Day 8 - Player Configuration Screen
- Build admin screen for player settings
- Add theme, control bar, autoplay, poster, and fallback options
- Add stream profile selection and playback defaults
- Test that changes apply without code changes

## Day 9 - Ad Placement Mapping Screen
- Build the admin screen for ad slot mapping
- Map AdButler tags to player slots
- Add on/off toggles for each placement
- Save and validate mapping changes

## Day 10 - Analytics and Event Health Screen
- Build a simple analytics overview screen
- Show Matomo summary KPIs and event trends
- Add event health/debug view for failed syncs or playback errors
- Add retry controls for failed jobs

## Day 11 - Roles, Audit, and Privacy
- Add roles: Admin, Ad Ops, Analyst, Content Manager, Viewer
- Add audit log for config changes
- Add consent and privacy controls
- Validate permissions and access rules

## Day 12 - QA, UAT, and Launch
- Run full QA across video, ads, cards, and analytics
- Verify ad timing and frequency caps
- Verify Matomo tracking and admin screen behavior
- Fix final issues and prepare launch handover

---

## Admin Panel Screens Included
- Player Configuration
- Ad Slot Mapping
- Interactive Cards Manager
- Analytics Overview
- Event Health and Debug
- Roles, Audit, and Privacy

---

## Final Deliverables
- Working Video.js player with Cloudflare Stream playback
- AdButler ad integration for video and banner placements
- Matomo tracking for behavior, funnels, and location
- Admin panel screens for operations and control
- QA checklist and launch handover notes

---

## Notes
- Mux is removed from this plan for now.
- Keep AdButler as the single ad-serving source.
- Keep the admin panel lightweight and focused on control, not full vendor replacement.

