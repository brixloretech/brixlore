import { create } from "zustand";
import { deviceService } from "../services/deviceService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define User type locally to avoid circular dependency
export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
};

// Dynamic import to avoid circular dependency with api.ts
async function getAuthService() {
  const module = await import("../services/authService");
  return module.authService;
}

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
};

type AuthActions = {
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isLoading: false, // Start as false - will be set to true only during actual operations
  isAuthenticated: false,
  error: null,

  signup: async (name, email, password) => {
    const state = get();
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const service = await getAuthService();
      const response = await service.signUp({ name, email, password });

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      deviceService.registerDevice().catch(() => {
        // Ignore registration failures (e.g., no device allowance)
      });
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.toString() ||
        "Registration failed. Please try again.";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  login: async (email, password) => {
    const state = get();
    if (state.isLoading) {
      return;
    }

    // Set loading state immediately
    set({ isLoading: true, error: null });

    // Safety net: Force stop loading after 60 seconds no matter what (for very unstable connections)
    const safetyTimeoutId = setTimeout(() => {
      const currentState = get();
      if (currentState.isLoading) {
        set({
          isLoading: false,
          error:
            "Login request timed out. Please check your internet connection and try again.",
          isAuthenticated: false,
          user: null,
        });
      }
    }, 60000); // 60 seconds - much longer for unstable connections

    try {
      // No timeout on login - let axios handle it (axios timeout is 30 seconds)
      // This allows for slower connections without premature timeouts
      const service = await getAuthService();
      const response = await service.login({ email, password });

      // Clear safety timeout
      clearTimeout(safetyTimeoutId);

      // Double-check we're still supposed to be loading
      const currentState = get();
      if (!currentState.isLoading) {
        return;
      }

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Clear limited access tracking on successful login
      try {
        const { useLimitedAccessStore } =
          await import("./useLimitedAccessStore");
        useLimitedAccessStore.getState().resetWatchedVideos();
        await useLimitedAccessStore.getState().saveToStorage();
      } catch (error) {
        console.error("Failed to reset limited access tracking:", error);
      }

      // Register device in the background (does not block login)
      deviceService.registerDevice().catch(() => {
        // Ignore registration failures (e.g., no device allowance)
      });
    } catch (error: any) {
      // Clear safety timeout
      clearTimeout(safetyTimeoutId);

      // Double-check we're still supposed to be loading
      const currentState = get();
      if (!currentState.isLoading) {
        return;
      }

      const errorMessage =
        error?.message ||
        error?.toString() ||
        "Login failed. Please try again.";
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      // Don't throw - let the component handle the error state
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Clear auth tokens
      const service = await getAuthService();
      await service.logout();

      // Clear local downloads (lazy import to avoid circular dependency)
      try {
        const { downloadService } = await import("../services/downloadService");
        const allMeta = await downloadService.getAllMeta();
        for (const meta of allMeta) {
          await downloadService.deleteDownload(meta.contentId);
        }
      } catch (error) {
        console.error("Failed to clear downloads on logout:", error);
      }

      // Clear device ID
      try {
        await AsyncStorage.removeItem("@device_id");
      } catch (error) {
        console.error("Failed to clear device ID:", error);
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || "Logout failed",
        isLoading: false,
      });
    }
  },

  refreshUser: async () => {
    try {
      // Add timeout to prevent hanging
      const service = await getAuthService();
      const user = await Promise.race([
        service.getCurrentUser(),
        new Promise<User | null>((resolve) =>
          setTimeout(() => resolve(null), 5000),
        ),
      ]);
      if (user) {
        set({ user, isAuthenticated: true });
      } else {
        // If API call failed, check if we have stored user
        const storedUser = await service.getUser();
        if (storedUser) {
          set({ user: storedUser, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      // On error, try to use stored user
      try {
        const service = await getAuthService();
        const storedUser = await service.getUser();
        if (storedUser) {
          set({ user: storedUser, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      } catch {
        set({ user: null, isAuthenticated: false });
      }
    }
  },

  checkAuth: async () => {
    // Safety timeout to ensure isLoading is always reset
    const safetyTimeout = setTimeout(() => {
      const currentState = get();
      if (currentState.isLoading && !currentState.isAuthenticated) {
        set({ isLoading: false });
      }
    }, 5000); // 5 second max for auth check

    try {
      set({ isLoading: true });

      // Check if user has a token (quick check)
      const service = await getAuthService();
      const hasToken = await service.isAuthenticated();

      clearTimeout(safetyTimeout);

      if (!hasToken) {
        // No token, user is not authenticated
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }

      // User has token, check if we have stored user data
      const storedUser = await service.getUser();

      if (storedUser) {
        // We have stored user, set it immediately
        set({ user: storedUser, isAuthenticated: true, isLoading: false });

        // Try to refresh user in background (don't wait)
        get()
          .refreshUser()
          .catch(() => {
            // Silently handle refresh errors
          });
        return;
      }

      // No stored user but has token - try to get user from API
      try {
        await Promise.race([
          get().refreshUser(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 5000),
          ),
        ]);
        clearTimeout(safetyTimeout);
      } catch (refreshError: any) {
        // If refresh fails, user is not authenticated (token might be invalid)
        set({ isAuthenticated: false, isLoading: false });
        clearTimeout(safetyTimeout);
      }
    } catch (error: any) {
      clearTimeout(safetyTimeout);

      // On any error, check if we have a stored user
      try {
        const service = await getAuthService();
        const user = await service.getUser();
        if (user) {
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      } catch {
        set({ isAuthenticated: false, isLoading: false });
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
