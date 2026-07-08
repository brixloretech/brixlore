# Brixlore Admin Panel: Content Manager Role Specification

This document defines the features, invite workflow, and permission boundaries for the **Content Manager** role in the Brixlore Admin Panel.

---

## 1. Role Overview
The **Content Manager** is a restricted administrative account designed for team members who manage the media catalog and ad configurations, but should not have access to customer data, financial transactions, site branding, or system operations.

---

## 2. Invite Workflow
1. **Initiation:** A Super Admin or Admin navigates to **User Management** in the settings.
2. **Details:** The admin enters the candidate's email address, name (optional), and selects the **Content Manager** role.
3. **Invitation Email:** The system sends an activation link to the user's email.
4. **Activation:** The invited user clicks the link, sets their account password, and is automatically redirected to sign in to the Admin Panel.

---

## 3. Authorized Features (What they CAN do)
A Content Manager has full access to content management and ad scheduling features:

* **Dashboard Overview:** View general platform stats (total content count, main category distribution, and focus queue suggestions).
* **Media Library:** View, edit, publish, or unpublish movie, documentary, and series content listings.
* **Content Uploads:** Upload new video files, trailers, seasons, episodes, and set media files.
* **Categories:** Create, update, or delete categories.
* **Video Transcoding:** Trigger background video transcoding to HLS format for new or replaced episodes.
* **Ad Settings:** Access and edit all ad placements (pre-roll, mid-roll, post-roll, outstream, and display banners), including skip triggers, failure rules, and geographical/age restrictions.

---

## 4. Restricted Features (What they CANNOT do)
To ensure system security, the Content Manager is blocked from the following features:

* **User Management:** Cannot view the user list, export user data, change team roles, or invite new administrators.
* **Subscriptions & Plans:** Cannot view active subscriptions, transaction lists, revenue highlights, or create/modify billing plans.
* **Customer Support:** Cannot view customer support requests or reply to user tickets.
* **Analytics Hub:** Cannot view detailed analytics reports for users, content, revenue, or offline downloads.
* **App Settings (Branding & Credentials):** Cannot modify the website logo, hero banners, theme background, or rotate administrative passwords.
* **System Operations:** Cannot view server logs or check system health metrics.

---

## 5. Navigation & Layout Rules (User Experience)
* **Sidebar Menu:** The sidebar hides all restricted links (User List, Plans, Transactions, Analytics, Support, App Settings, Logs, Health). The only items shown are **Dashboard**, **Library**, **Categories**, **Upload Content**, and **Ad Settings**.
* **Settings Page Hub:** When accessing the settings hub, only the **Ad Settings** card is visible. Branding and User Management cards are completely hidden.
* **Direct Access Block:** If a Content Manager manually types a restricted URL (such as `/admin/settings/branding` or `/admin/settings/users`) into the browser address bar, the system displays an **Access Denied** message and blocks page rendering.
