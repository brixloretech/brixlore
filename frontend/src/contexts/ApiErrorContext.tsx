"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ApiError,
  setGlobalApiErrorHandler,
  getApiErrorUserMessage,
} from "@/lib/api-client";
import { authService } from "@/lib/services";

type ApiErrorContextValue = {
  error: ApiError | null;
  message: string;
  dismiss: () => void;
};

const ApiErrorContext = createContext<ApiErrorContextValue | null>(null);

/** Show global banner for 403, network (0), and 5xx. Skip 401 (auth shows session/form error) and 400 (validation). */
function shouldShowGlobally(err: ApiError): boolean {
  if (err.status === 0) return true;
  if (err.status === 403) return true;
  if (err.status >= 500) return true;
  return false;
}

export function ApiErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  useEffect(() => {
    const handler = (err: ApiError) => {
      if (err.status === 401) {
        if (redirectingRef.current) return;
        redirectingRef.current = true;
        authService.logout();
        const isAdminRoute = pathname?.startsWith("/admin");
        const loginPath = isAdminRoute ? "/admin/login" : "/login";
        if (pathname !== loginPath) {
          router.replace(loginPath);
          if (typeof window !== "undefined") {
            window.location.assign(loginPath);
          }
        }
        setTimeout(() => {
          redirectingRef.current = false;
        }, 1500);
        return;
      }
      if (shouldShowGlobally(err)) setError(err);
    };
    setGlobalApiErrorHandler(handler);
    return () => setGlobalApiErrorHandler(null);
  }, [pathname, router]);

  const dismiss = useCallback(() => setError(null), []);

  const message = error ? getApiErrorUserMessage(error) : "";

  const value: ApiErrorContextValue = {
    error,
    message,
    dismiss,
  };

  return (
    <ApiErrorContext.Provider value={value}>
      {children}
    </ApiErrorContext.Provider>
  );
}

export function useApiError(): ApiErrorContextValue {
  const ctx = useContext(ApiErrorContext);
  if (ctx === null) {
    throw new Error("useApiError must be used within an ApiErrorProvider");
  }
  return ctx;
}
