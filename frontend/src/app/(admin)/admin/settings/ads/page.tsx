"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/ui";
import { adConfigService } from "@/lib/services/ad-config.service";
import type { AdConfigDto, AdFailureBehavior, AdTriggerMode } from "@/types/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-4 rounded-lg border border-neutral-700/50 p-4 hover:border-neutral-600/70 transition-colors"
    >
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`h-5 w-9 rounded-full transition-colors ${
            checked ? "bg-accent" : "bg-neutral-600"
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-400">{description}</p>
        )}
      </div>
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
      {children}
    </h3>
  );
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">{label}</label>
      {description && (
        <p className="text-xs text-neutral-400">{description}</p>
      )}
      {children}
    </div>
  );
}

// ─── Default config (mirrors DB defaults) ────────────────────────────────────

const DEFAULT_CONFIG: Omit<AdConfigDto, "id" | "updatedAt"> = {
  adsEnabled: false,
  preRollEnabled: false,
  preRollTagUrl: "",
  preRollSkippable: false,
  preRollSkipAfterSeconds: 5,
  midRollEnabled: false,
  midRollTagUrl: "",
  midRollTriggerMode: "INTERVAL",
  midRollIntervalMinutes: 10,
  midRollTimestamps: [],
  midRollSkippable: false,
  midRollSkipAfterSeconds: 5,
  midRollMaxPerVideo: 2,
  postRollEnabled: false,
  postRollTagUrl: "",
  postRollSkippable: false,
  postRollSkipAfterSeconds: 5,
  outstreamEnabled: false,
  outstreamTagUrl: "",
  bannerEnabled: false,
  bannerTagUrl: "",
  adFailureBehavior: "SKIP_IMMEDIATELY",
  adLoadTimeoutSeconds: 8,
  geoRestrictionsEnabled: false,
  geoBlockedCountries: [],
  ageRestrictionEnabled: false,
  minAge: 18,
};

// ─── Page component ──────────────────────────────────────────────────────────

export default function AdminAdSettingsPage() {
  const [config, setConfig] =
    useState<Omit<AdConfigDto, "id" | "updatedAt">>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Mid-roll timestamp editing (internal string before parsing) ────────────
  const [timestampsRaw, setTimestampsRaw] = useState("");
  const [geoCountriesRaw, setGeoCountriesRaw] = useState("");

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    try {
      const data = await adConfigService.getAdminAdConfig();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, updatedAt, ...rest } = data;
      setConfig(rest);
      setTimestampsRaw((rest.midRollTimestamps ?? []).join(", "));
      setGeoCountriesRaw((rest.geoBlockedCountries ?? []).join(", "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ad config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Parse the raw textarea values into arrays
    const parsedTimestamps = timestampsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedCountries = geoCountriesRaw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const payload = {
      ...config,
      midRollTimestamps: parsedTimestamps,
      geoBlockedCountries: parsedCountries,
    };

    try {
      const saved = await adConfigService.updateAdConfig(payload);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, updatedAt, ...rest } = saved;
      setConfig(rest);
      setTimestampsRaw((rest.midRollTimestamps ?? []).join(", "));
      setGeoCountriesRaw((rest.geoBlockedCountries ?? []).join(", "));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ad config");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof typeof config>(key: K, value: (typeof config)[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // ─── UI ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ad Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Configure AdButler VAST ad slots and playback behaviour for the web
            player. Changes take effect immediately on next page load.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 self-start"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </header>

      {/* Status messages */}
      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-3 text-sm text-green-400">
          Ad config saved successfully.
        </div>
      )}

      {/* ── Master toggle ──────────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Global ad toggle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="adsEnabled"
            checked={config.adsEnabled}
            onChange={(v) => set("adsEnabled", v)}
            label="Enable ads"
            description="Master switch. When off, no ads are requested and the player behaves as ad-free regardless of other settings."
          />
          {!config.adsEnabled && (
            <p className="rounded-md bg-yellow-900/20 border border-yellow-700/40 px-3 py-2 text-xs text-yellow-400">
              Ads are currently disabled. All other settings below are saved but
              have no effect until ads are enabled.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Pre-roll ──────────────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Pre-roll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="preRollEnabled"
            checked={config.preRollEnabled}
            onChange={(v) => set("preRollEnabled", v)}
            label="Enable pre-roll"
            description="Plays a VAST ad before the content starts."
          />
          <FieldRow
            label="VAST tag URL"
            description="AdButler VAST 2.0/3.0 tag URL for pre-roll. Leave blank to disable even when toggle is on."
          >
            <Input
              value={config.preRollTagUrl}
              onChange={(e) => set("preRollTagUrl", e.target.value)}
              placeholder="https://ads.adbutler.com/…"
              disabled={!config.preRollEnabled}
            />
          </FieldRow>
          <Toggle
            id="preRollSkippable"
            checked={config.preRollSkippable}
            onChange={(v) => set("preRollSkippable", v)}
            label="Allow viewers to skip pre-roll"
          />
          {config.preRollSkippable && (
            <FieldRow
              label="Skip button appears after (seconds)"
              description="Minimum: 1 second."
            >
              <Input
                type="number"
                min={1}
                max={30}
                value={config.preRollSkipAfterSeconds}
                onChange={(e) =>
                  set("preRollSkipAfterSeconds", Math.max(1, parseInt(e.target.value, 10) || 5))
                }
              />
            </FieldRow>
          )}
        </CardContent>
      </Card>

      {/* ── Mid-roll ──────────────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Mid-roll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="midRollEnabled"
            checked={config.midRollEnabled}
            onChange={(v) => set("midRollEnabled", v)}
            label="Enable mid-roll"
            description="Pauses content and plays a VAST ad during playback."
          />
          <FieldRow
            label="VAST tag URL"
            description="AdButler VAST tag URL for mid-roll."
          >
            <Input
              value={config.midRollTagUrl}
              onChange={(e) => set("midRollTagUrl", e.target.value)}
              placeholder="https://ads.adbutler.com/…"
              disabled={!config.midRollEnabled}
            />
          </FieldRow>

          {/* Trigger mode */}
          <FieldRow
            label="Trigger mode"
            description="How the player decides when to insert a mid-roll break."
          >
            <div className="flex gap-3">
              {(["INTERVAL", "FIXED_TIMESTAMPS"] as AdTriggerMode[]).map((mode) => (
                <label
                  key={mode}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    config.midRollTriggerMode === mode
                      ? "border-accent bg-accent/10 text-white"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="midRollTriggerMode"
                    value={mode}
                    checked={config.midRollTriggerMode === mode}
                    onChange={() => set("midRollTriggerMode", mode)}
                    className="sr-only"
                    disabled={!config.midRollEnabled}
                  />
                  <span>
                    {mode === "INTERVAL" ? "Interval-based" : "Fixed timestamps"}
                  </span>
                </label>
              ))}
            </div>
          </FieldRow>

          {config.midRollTriggerMode === "INTERVAL" && (
            <FieldRow
              label="Interval (minutes)"
              description="Insert a mid-roll break every N minutes of watched content."
            >
              <Input
                type="number"
                min={1}
                max={120}
                value={config.midRollIntervalMinutes}
                onChange={(e) =>
                  set("midRollIntervalMinutes", Math.max(1, parseInt(e.target.value, 10) || 10))
                }
                disabled={!config.midRollEnabled}
              />
            </FieldRow>
          )}

          {config.midRollTriggerMode === "FIXED_TIMESTAMPS" && (
            <FieldRow
              label="Timestamps"
              description="Comma-separated list of HH:MM:SS timestamps at which mid-rolls fire. Example: 00:05:00, 00:15:00"
            >
              <Input
                value={timestampsRaw}
                onChange={(e) => setTimestampsRaw(e.target.value)}
                placeholder="00:05:00, 00:15:00, 00:30:00"
                disabled={!config.midRollEnabled}
              />
            </FieldRow>
          )}

          <FieldRow
            label="Max mid-rolls per video"
            description="Cap on how many mid-roll breaks can fire in a single viewing session."
          >
            <Input
              type="number"
              min={1}
              max={20}
              value={config.midRollMaxPerVideo}
              onChange={(e) =>
                set("midRollMaxPerVideo", Math.max(1, parseInt(e.target.value, 10) || 2))
              }
              disabled={!config.midRollEnabled}
            />
          </FieldRow>

          <Toggle
            id="midRollSkippable"
            checked={config.midRollSkippable}
            onChange={(v) => set("midRollSkippable", v)}
            label="Allow viewers to skip mid-roll"
          />
          {config.midRollSkippable && (
            <FieldRow label="Skip button appears after (seconds)">
              <Input
                type="number"
                min={1}
                max={30}
                value={config.midRollSkipAfterSeconds}
                onChange={(e) =>
                  set("midRollSkipAfterSeconds", Math.max(1, parseInt(e.target.value, 10) || 5))
                }
              />
            </FieldRow>
          )}
        </CardContent>
      </Card>

      {/* ── Post-roll ─────────────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Post-roll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="postRollEnabled"
            checked={config.postRollEnabled}
            onChange={(v) => set("postRollEnabled", v)}
            label="Enable post-roll"
            description="Plays a VAST ad after the content ends."
          />
          <FieldRow label="VAST tag URL">
            <Input
              value={config.postRollTagUrl}
              onChange={(e) => set("postRollTagUrl", e.target.value)}
              placeholder="https://ads.adbutler.com/…"
              disabled={!config.postRollEnabled}
            />
          </FieldRow>
          <Toggle
            id="postRollSkippable"
            checked={config.postRollSkippable}
            onChange={(v) => set("postRollSkippable", v)}
            label="Allow viewers to skip post-roll"
          />
          {config.postRollSkippable && (
            <FieldRow label="Skip button appears after (seconds)">
              <Input
                type="number"
                min={1}
                max={30}
                value={config.postRollSkipAfterSeconds}
                onChange={(e) =>
                  set("postRollSkipAfterSeconds", Math.max(1, parseInt(e.target.value, 10) || 5))
                }
              />
            </FieldRow>
          )}
        </CardContent>
      </Card>

      {/* ── Outstream / Banner ────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Outstream &amp; Banner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionHeading>Outstream video</SectionHeading>
          <Toggle
            id="outstreamEnabled"
            checked={config.outstreamEnabled}
            onChange={(v) => set("outstreamEnabled", v)}
            label="Enable outstream ads"
            description="Video ads displayed outside the main player."
          />
          <FieldRow label="Outstream VAST tag URL">
            <Input
              value={config.outstreamTagUrl}
              onChange={(e) => set("outstreamTagUrl", e.target.value)}
              placeholder="https://ads.adbutler.com/…"
              disabled={!config.outstreamEnabled}
            />
          </FieldRow>

          <div className="my-2 border-t border-neutral-800" />
          <SectionHeading>Display banner</SectionHeading>
          <Toggle
            id="bannerEnabled"
            checked={config.bannerEnabled}
            onChange={(v) => set("bannerEnabled", v)}
            label="Enable banner ads"
            description="Static or animated banner ads alongside the player."
          />
          <FieldRow label="Banner tag URL">
            <Input
              value={config.bannerTagUrl}
              onChange={(e) => set("bannerTagUrl", e.target.value)}
              placeholder="https://ads.adbutler.com/…"
              disabled={!config.bannerEnabled}
            />
          </FieldRow>
        </CardContent>
      </Card>

      {/* ── Failure behaviour ─────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Failure behaviour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldRow
            label="If an ad fails to load"
            description="What the player does when the ad tag returns an error or times out."
          >
            <div className="flex gap-3">
              {(
                [
                  ["SKIP_IMMEDIATELY", "Skip and resume content"],
                  ["RETRY_ONCE", "Retry once, then resume"],
                ] as [AdFailureBehavior, string][]
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    config.adFailureBehavior === value
                      ? "border-accent bg-accent/10 text-white"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="adFailureBehavior"
                    value={value}
                    checked={config.adFailureBehavior === value}
                    onChange={() => set("adFailureBehavior", value)}
                    className="sr-only"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </FieldRow>

          <FieldRow
            label="Ad load timeout (seconds)"
            description="How long the player waits for an ad response before applying the failure behaviour above."
          >
            <Input
              type="number"
              min={3}
              max={30}
              value={config.adLoadTimeoutSeconds}
              onChange={(e) =>
                set("adLoadTimeoutSeconds", Math.max(3, parseInt(e.target.value, 10) || 8))
              }
            />
          </FieldRow>
        </CardContent>
      </Card>

      {/* ── Geo restrictions ──────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Geo restrictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="geoRestrictionsEnabled"
            checked={config.geoRestrictionsEnabled}
            onChange={(v) => set("geoRestrictionsEnabled", v)}
            label="Enable geo-based ad blocking"
            description="Suppress ads for viewers in the blocked countries listed below."
          />
          <FieldRow
            label="Blocked countries"
            description="Comma-separated ISO 3166-1 alpha-2 codes (e.g. US, GB, DE). Ads will not be shown to viewers in these countries."
          >
            <Input
              value={geoCountriesRaw}
              onChange={(e) => setGeoCountriesRaw(e.target.value)}
              placeholder="US, GB, DE"
              disabled={!config.geoRestrictionsEnabled}
            />
          </FieldRow>
        </CardContent>
      </Card>

      {/* ── Age restriction ───────────────────────────────────────────────── */}
      <Card className="border-neutral-700/60 bg-neutral-900/50">
        <CardHeader>
          <CardTitle>Age restriction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            id="ageRestrictionEnabled"
            checked={config.ageRestrictionEnabled}
            onChange={(v) => set("ageRestrictionEnabled", v)}
            label="Enable age restriction on ads"
            description="Suppress ads for viewers below the minimum age set in their profile."
          />
          <FieldRow
            label="Minimum age for ads"
            description="Viewers below this age will not be served ads."
          >
            <Input
              type="number"
              min={13}
              max={99}
              value={config.minAge}
              onChange={(e) =>
                set("minAge", Math.max(13, parseInt(e.target.value, 10) || 18))
              }
              disabled={!config.ageRestrictionEnabled}
            />
          </FieldRow>
          <p className="text-xs text-neutral-500">
            Note: Frequency capping is handled entirely within AdButler. Configure
            capping rules in your AdButler account under Campaign &rarr; Frequency Cap.
          </p>
        </CardContent>
      </Card>

      {/* Sticky footer save */}
      <div className="flex items-center justify-between rounded-lg border border-neutral-700/60 bg-neutral-900/80 px-4 py-3 backdrop-blur">
        {success ? (
          <span className="text-sm text-green-400">
            Changes saved successfully.
          </span>
        ) : (
          <span className="text-sm text-neutral-500">
            Unsaved changes will be lost on navigation.
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
