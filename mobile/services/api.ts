import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";

function resolveApiBaseUrl(): string {
  const fromExpoConfig =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;

  // Keep a concrete fallback to avoid invalid placeholder domains in dev builds.
  const fallback = "https://brick-tales-web-production-653a.up.railway.app";

  return (fromEnv || fromExpoConfig || fallback).replace(/\/$/, "");
}

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout - increased for unstable connections
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to get auth service (lazy import to avoid circular dependency)
async function getAuthService() {
  try {
    // Use require with type assertion to avoid TypeScript errors
    const authServiceModule =
      require("./authService") as typeof import("./authService");
    return authServiceModule.authService;
  } catch {
    return null;
  }
}

// Helper function to get auth store (lazy import to avoid circular dependency)
async function getAuthStore() {
  try {
    // Use require with type assertion to avoid TypeScript errors
    const authStoreModule =
      require("../store/useAuthStore") as typeof import("../store/useAuthStore");
    return authStoreModule.useAuthStore;
  } catch {
    return null;
  }
}

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add auth token if available (lazy import to avoid circular dependency)
    try {
      const authService = await getAuthService();
      if (authService) {
        const token = await authService.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // Ignore errors getting token
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    const originalRequest = config;

    // Handle 401 unauthorized - try to refresh token (lazy import to avoid circular dependency)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authService = await getAuthService();
        if (authService) {
          const newToken = await authService.refreshAccessToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed - logout user (lazy import)
        try {
          const useAuthStore = await getAuthStore();
          if (useAuthStore) {
            useAuthStore.getState().logout();
          }
        } catch (logoutError) {
          console.error("[API] Failed to logout:", logoutError);
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
