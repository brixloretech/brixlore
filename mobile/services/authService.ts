import { api } from "./api";
import * as SecureStore from "expo-secure-store";
import { deviceService } from "./deviceService";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  name?: string;
  email: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordDto = {
  email: string;
};

class AuthService {
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * Store tokens securely
   */
  private async storeTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error("Failed to store tokens:", error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to get refresh token:", error);
      return null;
    }
  }

  /**
   * Store user data
   */
  async storeUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to store user:", error);
    }
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr) as User;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { deviceIdentifier, platform } =
        await deviceService.getDeviceIdentity();

      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn?: number;
      }>("/auth/login", {
        email: credentials.email.trim(),
        password: credentials.password,
        platform,
        deviceIdentifier,
      });

      const { accessToken, refreshToken } = response.data;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server: missing tokens");
      }

      // Store tokens first
      await this.storeTokens(accessToken, refreshToken);

      // Get user info after login with extended timeout for unstable connections
      const userPromise = this.getCurrentUser();
      const timeoutPromise = new Promise<User | null>(
        (resolve) =>
          setTimeout(() => {
            resolve(null);
          }, 30000), // 30 seconds - increased for unstable connections
      );

      const user = await Promise.race([userPromise, timeoutPromise]);

      if (!user) {
        // If getCurrentUser failed or timed out, create a basic user from the token
        // This allows login to complete even if the user endpoint is slow
        const basicUser: User = {
          id: "temp",
          email: credentials.email,
          name: credentials.email.split("@")[0],
          role: "user",
        };
        await this.storeUser(basicUser);
        return { user: basicUser, accessToken, refreshToken };
      }

      await this.storeUser(user);
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("application not found")
      ) {
        throw new Error(
          "Backend API URL is invalid or unavailable. Update EXPO_PUBLIC_API_URL and restart Expo.",
        );
      }
      throw new Error(message);
    }
  }

  /**
   * Sign up user and start an authenticated session immediately.
   */
  async signUp(credentials: SignUpCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn?: number;
      }>("/auth/signup", {
        name: credentials.name?.trim() || undefined,
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const { accessToken, refreshToken } = response.data;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server: missing tokens");
      }

      await this.storeTokens(accessToken, refreshToken);

      const userPromise = this.getCurrentUser();
      const timeoutPromise = new Promise<User | null>((resolve) =>
        setTimeout(() => resolve(null), 30000),
      );

      const user = await Promise.race([userPromise, timeoutPromise]);

      if (!user) {
        const basicUser: User = {
          id: "temp",
          email: credentials.email,
          name: credentials.name?.trim() || credentials.email.split("@")[0],
          role: "user",
        };
        await this.storeUser(basicUser);
        return { user: basicUser, accessToken, refreshToken };
      }

      await this.storeUser(user);
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      throw new Error(message);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          return null;
        }

        const response = await api.post<{
          accessToken: string;
          refreshToken: string;
        }>("/auth/refresh", {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await this.storeTokens(accessToken, newRefreshToken);

        return accessToken;
      } catch (error) {
        // Refresh failed - clear tokens
        await this.logout();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<User>("/users/me");
      const user = response.data;
      await this.storeUser(user);
      return user;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }

  /** Change current user's password (authenticated). */
  async changePassword(
    dto: ChangePasswordDto,
  ): Promise<{ message: string } | null> {
    try {
      const response = await api.post<{ message: string }>(
        "/auth/change-password",
        dto,
      );
      return response.data ?? null;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Password change failed";
      throw new Error(message);
    }
  }

  /** Revoke all active sessions for current user (authenticated). */
  async revokeSessions(): Promise<{ message: string } | null> {
    try {
      const response = await api.post<{ message: string }>(
        "/auth/revoke-sessions",
      );
      return response.data ?? null;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to revoke sessions";
      throw new Error(message);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Request password reset email.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string } | null> {
    try {
      const response = await api.post<{ message: string }>(
        "/auth/forgot-password",
        {
          email: dto.email.trim(),
        },
      );
      return response.data ?? null;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to request password reset";
      throw new Error(message);
    }
  }
}

export const authService = new AuthService();
