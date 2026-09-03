"use client";

import { useEffect } from "react";

export default function FigmaRuntime() {
  useEffect(() => {
    void Promise.all([
      import("@/lib/figma/gsap-custom.js"),
      import("@/lib/figma/custom.js"),
    ]).then(() => {
      document.dispatchEvent(new Event("DOMContentLoaded"));
    });
  }, []);

  return null;
}
