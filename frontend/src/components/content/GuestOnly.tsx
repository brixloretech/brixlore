"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts";

type GuestOnlyProps = {
  children: ReactNode;
};

export function GuestOnly({ children }: GuestOnlyProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
