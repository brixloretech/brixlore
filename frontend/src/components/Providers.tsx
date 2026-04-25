"use client";

import { type ReactNode } from "react";
import { ApiErrorProvider, AuthProvider, MyListProvider } from "@/contexts";
import { SessionErrorBanner } from "@/components/auth";
import { ApiErrorBanner } from "@/components/layout";

/**
 * Client-side providers for the app. ApiErrorProvider registers global API error handling;
 * AuthProvider provides auth state; SessionErrorBanner and ApiErrorBanner show errors.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiErrorProvider>
      <AuthProvider>
        <MyListProvider>
          <SessionErrorBanner />
          <ApiErrorBanner />
          {children}
        </MyListProvider>
      </AuthProvider>
    </ApiErrorProvider>
  );
}
