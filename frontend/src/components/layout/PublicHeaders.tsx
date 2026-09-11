"use client";

import { usePathname } from "next/navigation";
import Header2 from "./Header-2";
import { Header } from "./Header";

/** The landing page uses the minimal header; other public pages keep Header-2. */
export default function PublicHeaders() {
  const pathname = usePathname();

  return (
    <>
      {/* {pathname === "/" ? <Header /> : null} */}
      <Header2 /> 
    </>
  );
}
