"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Download,
  KeyRound,
  Laptop,
  LogOut,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Input, Loader } from "@/components/ui";
import { RainbowButton } from "@/components/ui/rainbow-button";
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
  GetSubscriptionResponseDto,
  PublicPlanDto,
  UpdateUserProfileRequestDto,
  UserProfileDto,
} from "@/types/api";

type Panel = "identity" | "security" | "devices" | "data";
const SETTINGS_INPUT_CLASS =
  "h-14 rounded-2xl border-white/10 bg-black/45 px-4 text-[15px] text-white shadow-inner shadow-black/20 placeholder:text-white/25 hover:border-white/20 focus:border-white/60 focus:bg-black/65 focus:ring-4 focus:ring-white/10 disabled:border-white/[0.07] disabled:bg-white/[0.035] disabled:text-white/35";
const NAV: Array<{
  id: Panel;
  label: string;
  note: string;
  icon: typeof CircleUserRound;
}> = [
  {
    id: "identity",
    label: "Identity",
    note: "Profile and presence",
    icon: CircleUserRound,
  },
  {
    id: "security",
    label: "Security",
    note: "Password and sessions",
    icon: KeyRound,
  },
  {
    id: "devices",
    label: "Devices",
    note: "Your active screens",
    icon: Laptop,
  },
  { id: "data", label: "Data", note: "Billing and privacy", icon: ShieldCheck },
];

export default function SettingsPage() {
  const { user, isSubscribed } = useAuth();
  const [panel, setPanel] = useState<Panel>("identity");
  const [plans, setPlans] = useState<PublicPlanDto[]>([]);
  const [subscription, setSubscription] =
    useState<GetSubscriptionResponseDto | null>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [draft, setDraft] = useState<UpdateUserProfileRequestDto>({});
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      subscriptionService.getPlans(),
      subscriptionService.getSubscription(true),
      accountService.getProfile(),
      accountService.listDevices(),
    ])
      .then(([planList, current, currentProfile, registeredDevices]) => {
        if (!active) return;
        setPlans(planList);
        setSubscription(current ?? null);
        setProfile(currentProfile);
        setDraft({
          name: currentProfile.name ?? "",
          phone: currentProfile.phone ?? "",
          bio: currentProfile.bio ?? "",
        });
        setDevices(registeredDevices);
      })
      .catch(() => {
        if (active)
          setNotice({
            tone: "error",
            text: "Some account details could not be loaded.",
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const activePlan = useMemo(
    () => plans.find((item) => item.id === subscription?.planId) ?? null,
    [plans, subscription?.planId],
  );
  const name =
    profile?.name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Brixlore member";
  const email = profile?.email || user?.email || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const activeNav = NAV.find((item) => item.id === panel)!;
  const setError = (error: unknown) =>
    setNotice({ tone: "error", text: getApiErrorMessage(error) });

  async function saveProfile() {
    setNotice(null);
    setSaving(true);
    try {
      const updated = await accountService.updateProfile(draft);
      setProfile(updated);
      setNotice({ tone: "success", text: "Identity updated." });
    } catch (error) {
      setError(error);
    } finally {
      setSaving(false);
    }
  }
  async function savePassword() {
    setNotice(null);
    if (!currentPassword || !nextPassword || nextPassword !== confirmPassword) {
      setNotice({
        tone: "error",
        text:
          nextPassword !== confirmPassword
            ? "New passwords do not match."
            : "Enter your current and new password.",
      });
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword: nextPassword,
      });
      await accountService.revokeSessions();
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setNotice({
        tone: "success",
        text: "Password updated. Other sessions have been reset.",
      });
    } catch (error) {
      setError(error);
    } finally {
      setSaving(false);
    }
  }
  async function resetSessions() {
    setSaving(true);
    setNotice(null);
    try {
      const result = await accountService.revokeSessions();
      setNotice({ tone: "success", text: result.message ?? "Sessions reset." });
    } catch (error) {
      setError(error);
    } finally {
      setSaving(false);
    }
  }
  async function removeDevice(id: string) {
    setNotice(null);
    try {
      await accountService.removeDevice(id);
      setDevices((current) => current.filter((device) => device.id !== id));
      setNotice({ tone: "success", text: "Device disconnected." });
    } catch (error) {
      setError(error);
    }
  }
  async function portal() {
    setBillingLoading(true);
    setNotice(null);
    try {
      const result = await subscriptionService.createPortalSession(
        window.location.href,
      );
      if (result?.url) window.location.href = result.url;
      else
        setNotice({
          tone: "error",
          text: "Billing portal is unavailable right now.",
        });
    } catch (error) {
      setError(error);
    } finally {
      setBillingLoading(false);
    }
  }
  async function exportData() {
    setNotice(null);
    try {
      const data = await accountService.exportAccountData();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "brixlore-account-data.json";
      link.click();
      URL.revokeObjectURL(url);
      setNotice({ tone: "success", text: "Your account archive is ready." });
    } catch (error) {
      setError(error);
    }
  }
  async function deleteAccount() {
    setNotice(null);
    try {
      await accountService.deleteAccount();
      setNotice({ tone: "success", text: "Account deleted." });
    } catch (error) {
      setError(error);
    }
  }

  if (loading)
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <Loader size="lg" label="Calibrating your controls…" />
      </main>
    );

  return (
    <div className="min-h-[calc(100vh-57px)] w-full max-w-full overflow-x-hidden bg-[#050505] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <header className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_82%_10%,rgba(255,255,255,.16),transparent_28%),linear-gradient(115deg,#272727,#111)] px-6 py-9 sm:px-10 sm:py-12">
          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">
                Account
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
                Welcome back, {name}.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">
                Manage your profile, security, and devices without leaving your
                world of stories.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-black/35 p-3 backdrop-blur">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-white text-lg font-semibold text-black">
                {initials || "B"}
              </div>
              <div>
                <p className="text-lg font-semibold tracking-[-.04em]">
                  {name}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {activePlan?.name ||
                    (isSubscribed ? "Member access" : "Free access")}
                </p>
              </div>
            </div>
          </div>
        </header>
        {notice && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${notice.tone === "error" ? "border-red-400/35 bg-red-400/10 text-red-200" : "border-white/20 bg-white/10 text-white"}`}
          >
            <Check size={16} /> {notice.text}
          </div>
        )}
        <div className="mt-8">
          <nav
            className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
            aria-label="Settings panels"
          >
            {NAV.map((item) => {
              const Icon = item.icon;
              const selected = panel === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPanel(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${selected ? "bg-white text-black" : "bg-white/10 text-white/65 hover:bg-white/20 hover:text-white"}`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <main className="mt-5 min-w-0 rounded-2xl bg-[#1d1d1d] p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/45">
                  {activeNav.note}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.055em] sm:text-4xl">
                  {panel === "identity"
                    ? "Profile details"
                    : panel === "security"
                      ? "Security and access"
                      : panel === "devices"
                        ? "Manage your devices"
                        : "Privacy and billing"}
                </h2>
              </div>
              {panel === "identity" && (
                <RainbowButton
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="rounded-lg px-5"
                >
                  {saving ? "Saving..." : "Save changes"}
                </RainbowButton>
              )}
            </div>
            {panel === "identity" && (
              <div className="grid gap-7 pt-8 lg:grid-cols-[minmax(230px,.68fr)_minmax(0,1.32fr)] lg:gap-10">
                <aside className="flex flex-col justify-between rounded-[26px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                  <div>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-bold text-black">
                      {initials || "B"}
                    </span>
                    <p className="mt-5 text-sm font-semibold text-white">Your public identity</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      These details shape how your Brixlore presence appears across your account.
                    </p>
                  </div>
                  <div className="mt-8 border-t border-white/10 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Membership</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {activePlan?.name || (isSubscribed ? "Active member" : "Free access")}
                    </p>
                    <Link href="/dashboard/subscription" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/55 transition hover:text-white">
                      Manage access <ChevronRight size={13} />
                    </Link>
                  </div>
                </aside>
                <div className="rounded-[26px] border border-white/10 bg-black/25 p-4 sm:p-6">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">The essentials</p>
                      <p className="mt-1 text-xs text-white/40">Your email is managed by your sign-in account.</p>
                    </div>
                    <span className="hidden h-2 w-2 rounded-full bg-white/70 sm:block" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input label="Display name" className={SETTINGS_INPUT_CLASS} value={draft.name ?? ""} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
                    <Input label="Email" className={SETTINGS_INPUT_CLASS} value={email} disabled />
                    <Input label="Phone" className={SETTINGS_INPUT_CLASS} value={draft.phone ?? ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Add your number" />
                    <div className="hidden rounded-2xl border border-dashed border-white/10 sm:block" aria-hidden="true" />
                    <div className="sm:col-span-2">
                      <label htmlFor="profile-bio" className="mb-2 block text-sm font-medium text-white/75 ">Your bio</label>
                      <textarea
                        id="profile-bio"
                        value={draft.bio ?? ""}
                        onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                        placeholder="The stories you love, in a few words."
                        className="h-36 w-full resize-none rounded-2xl border border-white/10 bg-transparent px-4 py-4 text-[15px] text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-white/60 focus:bg-transparent focus:ring-4 focus:ring-white/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {panel === "security" && (
              <div className="grid gap-8 pt-8 lg:grid-cols-[.85fr_1.15fr]">
                <div className="border-r-0 border-white/15 lg:border-r lg:pr-8">
                  <KeyRound size={26} className="text-white/65" />
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-.05em]">
                    Security is a quiet luxury.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">
                    Change your password whenever you need and end every other
                    active session in one move.
                  </p>
                  <button
                    type="button"
                    onClick={resetSessions}
                    disabled={saving}
                    className="mt-8 inline-flex items-center gap-2 border-b border-white/50 pb-2 text-sm font-bold hover:text-white/60"
                  >
                    <LogOut size={15} />{" "}
                    {saving ? "Working..." : "Reset all sessions"}
                  </button>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-black/25 p-4 sm:p-6">
                  <p className="mb-6 text-base font-semibold text-white">Choose a new password</p>
                  <div className="space-y-5">
                  <Input
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className={SETTINGS_INPUT_CLASS}
                  />
                  <Input
                    label="New password"
                    type="password"
                    value={nextPassword}
                    onChange={(event) => setNextPassword(event.target.value)}
                    className={SETTINGS_INPUT_CLASS}
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={SETTINGS_INPUT_CLASS}
                  />
                  <RainbowButton
                    type="button"
                    onClick={savePassword}
                    disabled={saving}
                    className="mt-3 rounded-lg px-5"
                  >
                    {saving ? "Updating..." : "Update password"}
                  </RainbowButton>
                  </div>
                </div>
              </div>
            )}
            {panel === "devices" && (
              <div className="pt-8">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-white/55">
                    Every screen currently connected to your Brixlore world.
                  </p>
                  <span className="text-xs text-white/45">
                    {String(devices.length).padStart(2, "0")} ACTIVE
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {devices.length ? (
                    devices.map((device) => (
                      <article
                        key={device.id}
                        className="rounded-xl bg-[#141414] p-5"
                      >
                        <div className="flex items-start justify-between">
                          <Laptop size={19} className="text-white/55" />
                          <button
                            type="button"
                            onClick={() => removeDevice(device.id)}
                            className="text-xs font-bold text-white/45 transition hover:text-white"
                          >
                            Disconnect
                          </button>
                        </div>
                        <h3 className="mt-7 text-xl font-semibold tracking-[-.04em]">
                          {getDeviceDisplayName(
                            device.deviceIdentifier,
                            device.platform as DevicePlatform,
                          )}
                        </h3>
                        <p className="mt-2 text-xs text-white/45">
                          {device.platform} · Last active{" "}
                          {new Date(device.lastActiveAt).toLocaleDateString()}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="col-span-2 rounded-xl bg-white/5 p-8 text-sm text-white/50">
                      Devices appear here after you sign in.
                    </p>
                  )}
                </div>
              </div>
            )}
            {panel === "data" && (
              <div className="grid gap-4 pt-8 sm:grid-cols-2">
                <section className="rounded-xl bg-white p-6 text-black sm:p-8">
                  <CreditCard size={25} />
                  <h3 className="mt-6 text-3xl font-semibold leading-[.92] tracking-[-.06em]">
                    Membership,
                    <br />
                    your terms.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-black/60">
                    Update your payment details and manage your membership
                    through the secure billing portal.
                  </p>
                  <RainbowButton
                    type="button"
                    onClick={portal}
                    disabled={billingLoading}
                    className="mt-8 rounded-lg px-5"
                  >
                    {billingLoading ? "Opening..." : "Open billing portal"}
                  </RainbowButton>
                </section>
                <section className="rounded-xl bg-[#141414] p-6 sm:p-8">
                  <Download size={25} className="text-white/65" />
                  <h3 className="mt-6 text-3xl font-semibold leading-[.92] tracking-[-.06em]">
                    Your data,
                    <br />
                    on demand.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/55">
                    Download a full copy of your account record whenever you
                    want.
                  </p>
                  <button
                    type="button"
                    onClick={exportData}
                    className="mt-8 inline-flex items-center gap-2 border-b border-white/50 pb-2 text-sm font-bold"
                  >
                    Download archive <Download size={15} />
                  </button>
                </section>
                <section className="sm:col-span-2 rounded-xl border border-red-400/25 bg-red-400/[.06] p-6 sm:flex sm:items-end sm:justify-between sm:p-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-red-200/60">
                      Permanent action
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-.05em] text-red-100">
                      Close your Brixlore account.
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-red-100/60">
                      This permanently removes your account and cannot be
                      undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-300/45 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500 hover:text-white sm:mt-0"
                  >
                    <Trash2 size={16} /> Delete account
                  </button>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
