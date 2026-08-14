"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Loader } from "@/components/ui";
import { useAuth } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  accountService,
  authService,
  subscriptionService,
} from "@/lib/services";
import { getDeviceDisplayName } from "@/lib/device-utils";
import type {
  DeviceDto,
  DevicePlatform,
  PublicPlanDto,
  UpdateUserProfileRequestDto,
  UserProfileDto,
  GetSubscriptionResponseDto,
} from "@/types/api";

export default function SettingsPage() {
  const { user, isSubscribed } = useAuth();
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [subscription, setSubscription] =
    useState<GetSubscriptionResponseDto | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [profileDraft, setProfileDraft] = useState<UpdateUserProfileRequestDto>(
    {},
  );
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      accountService.getProfile(),
      accountService.listDevices(),
    ])
      .then(([planList, subscriptionRes, profileRes, devicesRes]) => {
        if (!active) return;
        setPlans(planList);
        setPlanId(subscriptionRes.planId ?? null);
        setSubscription(subscriptionRes ?? null);
        setProfile(profileRes);
        setProfileDraft({
          name: profileRes.name ?? "",
          phone: profileRes.phone ?? "",
          bio: profileRes.bio ?? "",
        });
        setDevices(devicesRes);
      })
      .catch(() => {
        if (!active) return;
        setPlans([]);
        setPlanId(null);
        setProfile(null);
        setDevices([]);
      })
      .finally(() => {
        if (!active) return;
        setProfileLoading(false);
        setDeviceLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const planName = useMemo(
    () => plans.find((plan) => plan.id === planId)?.name ?? null,
    [plans, planId],
  );
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : null;
  // const displayName = profile?.name ?? user?.name ?? ""; // Removed unused variable
  const email = profile?.email ?? user?.email ?? "";

  const formatNextChargeDate = (isoDate?: string): string => {
    if (!isoDate) return "--";
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  };

  const isFreePlan = plans.find((plan) => plan.id === planId)?.price === 0;
  const nextChargeLabel = isFreePlan ? "--" : formatNextChargeDate(subscription?.currentPeriodEnd);

  const isLoading = profileLoading || deviceLoading;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Loader size="lg" label="Loading settings…" />
      </main>
    );
  }

  async function handleOpenBillingPortal() {
    setBillingError(null);
    setBillingLoading(true);
    try {
      const res = await subscriptionService.createPortalSession(
        window.location.href,
      );
      if (res?.url) {
        window.location.href = res.url;
      } else {
        setBillingError("Billing portal is unavailable right now.");
      }
    } catch (err) {
      setBillingError(getApiErrorMessage(err));
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSettingsError(null);
    setSettingsSuccess(null);
    setProfileSaving(true);
    try {
      const updated = await accountService.updateProfile(profileDraft);
      setProfile(updated);
      setProfileDraft({
        name: updated.name ?? "",
        phone: updated.phone ?? "",
        bio: updated.bio ?? "",
      });
      setSettingsSuccess("Profile updated.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword() {
    setSettingsError(null);
    setSettingsSuccess(null);
    if (!passwordCurrent || !passwordNext) {
      setSettingsError("Enter your current and new password.");
      return;
    }
    if (passwordNext !== passwordConfirm) {
      setSettingsError("New passwords do not match.");
      return;
    }
    setSecuritySaving(true);
    try {
      await authService.changePassword({
        currentPassword: passwordCurrent,
        newPassword: passwordNext,
      });
      await accountService.revokeSessions();
      setPasswordCurrent("");
      setPasswordNext("");
      setPasswordConfirm("");
      setSettingsSuccess("Password updated and sessions reset.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    } finally {
      setSecuritySaving(false);
    }
  }

  async function handleResetSessions() {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSecuritySaving(true);
    try {
      const res = await accountService.revokeSessions();
      setSettingsSuccess(res.message ?? "Sessions reset.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    } finally {
      setSecuritySaving(false);
    }
  }

  async function handleRemoveDevice(id: string) {
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      await accountService.removeDevice(id);
      setDevices((prev) => prev.filter((device) => device.id !== id));
      setSettingsSuccess("Device removed.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    }
  }

  async function handleExportData() {
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      const res = await accountService.exportAccountData();
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const formatDate = (value?: string) => {
        if (!value) return "--";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString();
      };

      const profileHtml = `
        <h2>Profile</h2>
        <table>
          <tr><th>Name</th><td>${escapeHtml(res.user.name ?? "")}</td></tr>
          <tr><th>Email</th><td>${escapeHtml(res.user.email)}</td></tr>
          <tr><th>Phone</th><td>${escapeHtml(res.user.phone ?? "")}</td></tr>
          <tr><th>Bio</th><td>${escapeHtml(res.user.bio ?? "")}</td></tr>
          <tr><th>Member since</th><td>${escapeHtml(formatDate(res.user.createdAt))}</td></tr>
        </table>
      `;

      const devicesRows = res.devices.length
        ? res.devices
            .map(
              (device) => `
          <tr>
            <td>${escapeHtml(device.deviceIdentifier)}</td>
            <td>${escapeHtml(device.platform)}</td>
            <td>${escapeHtml(formatDate(device.lastActiveAt))}</td>
          </tr>
        `,
            )
            .join("")
        : `<tr><td colspan="3">No devices registered.</td></tr>`;

      const devicesHtml = `
        <h2>Devices</h2>
        <table>
          <tr><th>Device</th><th>Platform</th><th>Last active</th></tr>
          ${devicesRows}
        </table>
      `;

      const subscriptionRows = res.subscriptions.length
        ? res.subscriptions
            .map(
              (sub) => `
          <tr>
            <td>${escapeHtml(sub.planId)}</td>
            <td>${escapeHtml(sub.status)}</td>
            <td>${escapeHtml(formatDate(sub.startDate))}</td>
            <td>${escapeHtml(formatDate(sub.endDate))}</td>
          </tr>
        `,
            )
            .join("")
        : `<tr><td colspan="4">No subscriptions found.</td></tr>`;

      const subscriptionsHtml = `
        <h2>Subscriptions</h2>
        <table>
          <tr><th>Plan</th><th>Status</th><th>Start date</th><th>End date</th></tr>
          ${subscriptionRows}
        </table>
      `;

      const html = `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Account data export</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
              h1 { margin-bottom: 8px; }
              h2 { margin-top: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 8px; }
              th { background: #f3f4f6; }
              .meta { color: #6b7280; font-size: 0.9rem; }
            </style>
          </head>
          <body>
            <h1>Account data export</h1>
            <p class="meta">Generated on ${escapeHtml(new Date().toLocaleString())}</p>
            ${profileHtml}
            ${devicesHtml}
            ${subscriptionsHtml}
          </body>
        </html>
      `;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "account-data.html";
      link.click();
      URL.revokeObjectURL(url);
      setSettingsSuccess("Account data downloaded.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    }
  }

  async function handleDeleteAccount() {
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      await accountService.deleteAccount();
      setSettingsSuccess("Account deleted.");
    } catch (err) {
      setSettingsError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="font-sans">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Account settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Shape your viewing experience
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Update your profile, tune playback, and keep your account secure
          across devices.
        </p>
      </header>

      <section
        className="relative overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-900/60 p-6 sm:p-8"
        aria-label="Account overview"
      >
        <div
          className="absolute -top-20 right-8 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 left-8 h-48 w-48 rounded-full bg-white/5 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
              Profile snapshot
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Your account at a glance
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
                Plan: {planName ?? (isSubscribed ? "Active" : "Free")}
              </span>
              <span className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
                {memberSince ? `Member since ${memberSince}` : "Member profile"}
              </span>
              <span className="rounded-full border border-neutral-700/70 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
                {email ? "Email on file" : "Add an email"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={handleSaveProfile}>
              {profileSaving ? "Saving..." : "Save changes"}
            </Button>
            <Link href="/subscription">
              <Button type="button" variant="outline" size="lg">
                Manage plan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {(settingsError || settingsSuccess) && (
        <div className="mt-6 rounded-2xl border border-neutral-700/50 bg-neutral-900/60 px-4 py-3 text-sm">
          {settingsError && (
            <p className="text-red-400" role="alert">
              {settingsError}
            </p>
          )}
          {!settingsError && settingsSuccess && (
            <p className="text-emerald-300" role="status">
              {settingsSuccess}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section
            className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6"
            aria-label="Profile details"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Profile details
                </h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Keep your profile fresh for personalized recommendations.
                </p>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Editable
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Display name"
                placeholder="Your name"
                value={profileDraft.name ?? ""}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@email.com"
                value={email}
                disabled
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 000-1289"
                value={profileDraft.phone ?? ""}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Bio
                </label>
                <textarea
                  className="h-24 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                  placeholder="Tell us what you like to watch."
                  value={profileDraft.bio ?? ""}
                  onChange={(event) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      bio: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={handleSaveProfile}>
                {profileSaving ? "Saving..." : "Update profile"}
              </Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </div>
          </section>

          <section
            className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6"
            aria-label="Security"
          >
            <h3 className="text-lg font-semibold text-white">Security</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Update your password and protect your account.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Current password"
                type="password"
                placeholder="********"
                value={passwordCurrent}
                onChange={(event) => setPasswordCurrent(event.target.value)}
              />
              <Input
                label="New password"
                type="password"
                placeholder="********"
                value={passwordNext}
                onChange={(event) => setPasswordNext(event.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="********"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={handleChangePassword}>
                {securitySaving ? "Saving..." : "Save security"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetSessions}
              >
                {securitySaving ? "Working..." : "Reset sessions"}
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section
            className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6"
            aria-label="Subscription"
          >
            <h3 className="text-lg font-semibold text-white">Subscription</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Manage your plan and billing details.
            </p>
            <div className="mt-5 rounded-xl border border-neutral-700/70 bg-neutral-950/60 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-neutral-500">
                Current plan
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {planName ?? (isSubscribed ? "Active plan" : "Free")}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {isSubscribed
                  ? "Subscription benefits are active."
                  : "Upgrade for exclusive series and premium features."}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>Status: {isSubscribed ? "Active" : "Free"}</span>
                <span>Next charge: {nextChargeLabel}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/subscription">
                <Button type="button" size="sm">
                  View plans
                </Button>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenBillingPortal}
                disabled={billingLoading}
              >
                {billingLoading ? "Opening..." : "Update card"}
              </Button>
            </div>
            {billingError && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {billingError}
              </p>
            )}
          </section>

          <section
            className="rounded-2xl border border-neutral-700/50 bg-neutral-900/60 p-6"
            aria-label="Devices"
          >
            <h3 className="text-lg font-semibold text-white">Devices</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Manage where you are signed in.
            </p>
            <div className="mt-5 space-y-3 text-sm text-neutral-300">
              {deviceLoading ? (
                <p className="text-sm text-neutral-400">Loading devices...</p>
              ) : devices.length > 0 ? (
                devices.map((device) => {
                  const displayName = getDeviceDisplayName(
                    device.deviceIdentifier,
                    device.platform as DevicePlatform,
                  );
                  const lastActive = new Date(device.lastActiveAt);
                  const isRecent =
                    Date.now() - lastActive.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
                  const lastActiveText = isRecent
                    ? lastActive.toLocaleDateString()
                    : lastActive.toLocaleDateString();

                  return (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-700/70 bg-neutral-950/60 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {device.platform}
                          {isRecent && (
                            <span className="ml-2 text-emerald-400">
                              • Active
                            </span>
                          )}
                          {!isRecent && (
                            <span className="ml-2">
                              • Last active {lastActiveText}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="ml-3 shrink-0 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors"
                        title="Remove this device"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-neutral-700/70 bg-neutral-950/40 px-4 py-6 text-center">
                  <p className="text-sm text-neutral-400">
                    No devices registered yet.
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Devices are registered automatically when you sign in.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section
            className="rounded-2xl border border-red-500/40 bg-neutral-900/60 p-6"
            aria-label="Privacy"
          >
            <h3 className="text-lg font-semibold text-white">Privacy & data</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Download your data or remove your account.
            </p>
            <div className="mt-5 space-y-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleExportData}
              >
                Download data
              </Button>
              <Button
                type="button"
                variant="danger"
                fullWidth
                onClick={handleDeleteAccount}
              >
                Delete account
              </Button>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Deleting your account is permanent and cannot be undone.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
