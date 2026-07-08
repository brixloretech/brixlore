# Stripe Integration Reference

This document outlines the Stripe payment and subscription integration architecture within the Brixlore platform, highlighting functions available to users, admin management capabilities, and automated synchronization events.

---

## 📂 Architecture Overview

The system consists of:
*   **Stripe Services (`stripe.service.ts`)**: The core NestJS backend service wrapper handling all interactions with the Stripe API, including checkout sessions, customer portal sessions, customer registration, self-healing price resolution, and webhook event processing.
*   **Subscriptions Controller (`subscriptions.controller.ts`)**: Exposes public and authenticated endpoints for the frontend application.
*   **Admin Panel Service & Controller**: Allows administrative monitoring of revenue, plans mapping, and active subscriptions list.
*   **Prisma Database Schema (`schema.prisma`)**: Tracks `User.stripeCustomerId`, `Plan.stripePriceId` / `Plan.yearlyStripePriceId`, and the user's `Subscription` records.

---

## 👤 User-Facing Stripe Functions

Brixlore grants subscribers full control of their billing cycles and subscription statuses. The following options are available to users:

### 1. Browse and Select Plans
*   **Endpoint**: `GET /subscriptions/plans` and `GET /subscriptions/plans/:id` (Public)
*   **Details**: Users can retrieve all subscription tiers from the database. Plans contain metadata such as monthly price, yearly price, device limits, offline viewing permissions (`offlineAllowed`), and download limits (`maxOfflineDownloads`).

### 2. Subscribe & Checkout (SCA / 3DS Compliant)
*   **Endpoint**: `POST /subscriptions/checkout-session`
*   **Details**: Initiates a Stripe Checkout Session for a selected plan and billing cycle (`MONTHLY` or `YEARLY`).
    *   Generates a Stripe-hosted payment page redirect URL.
    *   Creates a Stripe Customer if one does not already exist.
    *   Supports introductory trials for first-time subscribers by injecting trial configurations dynamically (default: 7 days).
    *   Handles SCA (Strong Customer Authentication) and 3D Secure verification directly via Stripe Checkout.

### 3. Customer Billing Portal Redirect
*   **Endpoint**: `POST /subscriptions/portal-session`
*   **Details**: Generates a secure link to the Stripe Customer Portal, giving users total control over their subscriptions. Inside the portal, users can:
    *   Cancel or renew their active subscription.
    *   Change or upgrade/downgrade subscription tiers (e.g., Monthly to Yearly).
    *   Add, remove, or update credit card information and billing details.
    *   Review payment history and download invoices/receipts as PDF files.

### 4. Billing Summary UI
*   **Endpoint**: `GET /subscriptions/billing-summary`
*   **Details**: Fetches default payment method details (card brand, last 4 digits, expiration date) and logs the last 10 invoices (amount, paid/due status, and hosted links) to display directly in the application's account settings page.

### 5. Self-Healing Manual Sync
*   **Endpoint**: `POST /subscriptions/sync`
*   **Details**: A fallback endpoint that allows users to manually sync their Stripe subscription details to the local database. This serves as a self-healing utility for situations where webhook deliveries fail or lag (such as on localhost/dev environments).

### 6. In-App Subscription Upgrade & Downgrade
*   **Endpoint**: `POST /subscriptions/update-plan`
*   **Details**: Enables authenticated users to change their subscription plan or billing cycle directly within the app's pricing interface.
    *   Finds the active subscription and updates its Stripe item price to the new plan's `stripePriceId` or `yearlyStripePriceId`.
    *   Triggers Stripe proration (`proration_behavior: 'create_prorations'`) to automatically calculate credits/charges.
    *   Saves the change and syncs the updated subscription details to the local DB immediately.

### 7. In-App Subscription Cancellation
*   **Endpoint**: `POST /subscriptions/cancel`
*   **Details**: Enables authenticated users to cancel their subscription from the subscription dashboard.
    *   Updates the Stripe subscription to cancel at the end of the current billing cycle (`cancel_at_period_end: true`).
    *   Synchronizes status changes to the database, setting the local subscription status to `CANCELLED`. Access remains active until the end of the billing period, at which point the subscription expires.

---

## 🛠️ Admin Control & Management

Admins cannot directly modify a user's subscription inside Stripe for security and auditing reasons, but they have complete control over how plans map to Stripe and how subscriptions are monitored.

### 1. Subscription & Revenue Analytics
*   **Endpoint**: `GET /admin/stats` and `GET /admin/subscriptions`
*   **Details**: Admins can view:
    *   Total active subscribers, cancelled subscription counts, and expired subscription counts.
    *   **Active Revenue**: Aggregated sum of active subscription prices (Monthly/Yearly) mapping to the database.
    *   Alerts on plans with zero active subscribers to optimize pricing strategies.

### 2. Plan Creation, Updates, and Deletion
*   **Endpoints**:
    *   `POST /admin/plans` (Create a plan)
    *   `PATCH /admin/plans/:id` (Update plan metadata and Stripe pricing IDs)
    *   `DELETE /admin/plans/:id` (Delete a plan)
*   **Details**:
    *   Admins can create plans in the DB and link them to Stripe products by populating `stripePriceId` (Monthly) and `yearlyStripePriceId` (Yearly).
    *   **Self-Healing Price Generator**: If an admin creates a plan or initiates checkout with a plan missing price IDs in Stripe, the system executes `resolveOrRegisterPriceInStripe`. It dynamically queries Stripe for matching product names, registers the product/pricing on Stripe, and updates the local database with the generated Stripe Price IDs automatically.
    *   **Safeguard**: Admins are prevented from deleting any subscription plan that currently has active subscribers.

---

## ⚡ Stripe Webhook Events & Offline Access

Webhook events keep the database perfectly synced with Stripe states. When subscriptions change, user access privileges adapt immediately.

### 🔄 Supported Stripe Events
The webhook endpoint (`POST /subscriptions/webhook`) verifies signature authenticity using `STRIPE_WEBHOOK_SECRET` and handles the following events:

1.  **`checkout.session.completed`**:
    *   Triggered when a checkout is completed successfully.
    *   Retrieves the Stripe subscription object and calls `syncSubscriptionFromStripe`.
    *   Creates/updates the local database `Subscription` record to `ACTIVE`.
    *   **Prevents Multi-Plan Stacking**: Automatically cancels any other active subscriptions for this user (e.g. Free Tier) to keep a clean 1-plan limit.

2.  **`customer.subscription.updated`**:
    *   Triggered when a user upgrades, downgrades, updates payment details, cancels at period end, or fails payments.
    *   Syncs status changes to the database.
    *   **Graceful Revocation**: If a subscription transitions to an inactive state (e.g., payment fails or cancellation period finishes), the system calls `revokeOfflineAccess`. This immediately marks all offline downloads for the user's devices as `REVOKED`.

3.  **`customer.subscription.deleted`**:
    *   Triggered when a subscription is fully terminated/expires.
    *   Sets local status to `EXPIRED`, stamps the end date, and immediately revokes offline downloads.

---

## 📱 Mobile Subscription Management (Stripe Users)

The React Native / Expo mobile application provides integrated support for self-service subscription management for users who have subscribed via Stripe:

- Subscription Details and Cancellation:
  - Users with active Stripe subscriptions (where stripeSubscriptionId is not null) can cancel their subscriptions directly from the mobile app subscription details screen.
  - A confirmation dialog displays the remaining period end date before confirming cancellation.
  - Cancelled subscriptions display a warning banner indicating they are scheduled to cancel on their expiration date.
- In-App Upgrades and Downgrades:
  - Users with active Stripe subscriptions can change their plans or billing cycles directly from the plans screen.
  - The plans screen dynamically shows 'Change Plan' on billing buttons for active Stripe users instead of 'Subscribe Now'.
  - Confirming the plan change updates Stripe with proration and immediately refreshes the active client subscription state.

---

## 🔒 User Subscriptions Management Summary

| Action | Managed By | Backend Processing / DB Impacts |
| :--- | :--- | :--- |
| **Upgrade / Downgrade Plan** | User (in-app / Stripe Portal) | Backend updates the subscription item in Stripe (`POST /subscriptions/update-plan`) or webhook triggers `customer.subscription.updated`. Updates local plan ID, handles proration, and adjusts permissions. |
| **Cancel Subscription** | User (in-app / Stripe Portal) | Backend updates subscription to cancel at period end (`POST /subscriptions/cancel`) or webhook triggers. Sets subscription status to `CANCELLED`. Access remains active until the end of the billing period. |
| **Billing Expiry / Unpaid** | Stripe System (automated) | Webhook triggers `customer.subscription.deleted` or status transitions to `EXPIRED`. Immediately revokes offline access (all downloads set to `REVOKED`). |
| **Update Credit Card** | User (via Stripe Portal) | Handled purely inside Stripe; frontend displays updated card brand & last 4 digits via billing summary. |
| **Plan Pricing Adjustment** | Admin (Brixlore Dashboard) | Links new Stripe Price IDs to existing plans. Checkouts reflect updated prices instantly. |
