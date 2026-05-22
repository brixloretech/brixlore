# Admin Panel Screen Recommendation

## Quick Answer
Yes, you should build admin panel screens, but only a lightweight control layer.
Do not rebuild full dashboards of TargetVideo, Ad Butler, Mux, or Matomo.

---

## Recommended Approach
Build a thin internal admin panel for:
- integration control
- mapping and configuration
- health monitoring
- business-level summary

Keep advanced operations inside vendor platforms:
- TargetVideo for player/video operations
- Ad Butler for campaign and ad operations
- Mux for deep video QoE analysis
- Matomo for full product analytics exploration

---

## Must-Have Screens

### 1. Integration Settings
Purpose: connect and validate all services.

Include:
- API key/token status (connected, invalid, expiring)
- webhook endpoint status
- environment toggle (staging/production)
- test connection button for each service

### 2. Ad Placement Mapping
Purpose: map ad tags to player and page placements.

Include:
- TargetVideo slot mapping:
  - pre-roll
  - mid-roll
  - post-roll
  - outstream
- Ad Butler placement mapping for non-video areas:
  - homepage banner
  - article placements
  - app non-video screens
- enable/disable toggle per placement

### 3. Unified KPI Overview
Purpose: one business view across systems.

Include:
- video starts/completions (TargetVideo + Mux)
- ad impressions/clicks/fill rate (Ad Butler)
- conversion metrics (Matomo)
- date range and platform filter (web/app)

### 4. Event Health and Debug
Purpose: detect and fix integration issues fast.

Include:
- last successful sync time
- failed events/webhooks count
- retry failed sync action
- error log summary with source label (TargetVideo/Ad Butler/Mux/Matomo)

### 5. Users, Roles, and Audit Log
Purpose: secure operation and accountability.

Include:
- roles: Admin, Ad Ops, Analyst, Viewer
- permission-based access to pages/actions
- audit trail for config changes

### 6. Privacy and Consent Controls
Purpose: compliance and regional controls.

Include:
- consent mode status by region
- ability to disable tracking by region/environment
- data-retention settings view

---

## Nice-to-Have Screens

### 1. Alert Center
- buffering spike alerts
- fill-rate drop alerts
- tracking outage alerts

### 2. Campaign Calendar Snapshot
- high-level campaign schedule view
- placement availability by date

### 3. Revenue Snapshot
- estimated revenue by placement/platform
- trend line by day/week/month

---

## What Not to Build

- full campaign builder (already in Ad Butler)
- full video analytics explorer (already in Mux)
- full traffic analytics suite (already in Matomo)
- full video CMS replacement (already in TargetVideo)

Reason:
- duplicate effort
- higher maintenance cost
- inconsistent data ownership

---

## Suggested Information Architecture

- Dashboard
- Integrations
- Ad Mapping
- Analytics Overview
- Event Health
- Privacy & Consent
- Users & Audit

This structure keeps it simple for business users and operational teams.

---

## Rollout Plan

### Phase 1 (MVP)
- Integration Settings
- Ad Placement Mapping
- Event Health

### Phase 2
- Unified KPI Overview
- Users/Roles/Audit

### Phase 3
- Privacy/Consent controls
- Alerts and revenue snapshots

---

## Final Recommendation
Build a lightweight admin panel that orchestrates the stack, not replaces it.

This gives your client:
- centralized control
- faster troubleshooting
- clearer executive reporting
- lower long-term maintenance risk
