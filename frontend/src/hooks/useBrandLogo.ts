"use client";

import { useEffect, useState } from "react";
import { fetchBranding } from "@/lib/branding";

export function useBrandLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchBranding()
      .then((branding) => {
        if (!active) return;
        setLogoUrl(branding.logoUrl ?? null);
      })
      .catch(() => {
        if (!active) return;
        setLogoUrl(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return logoUrl;
}
