import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterWithSubscriptionRequestDto,
  RegisterResponseDto,
  SignupSubscriptionIntentRequestDto,
  SignupSubscriptionIntentResponseDto,
  SignupSubscriptionFinalizeRequestDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  ChangePasswordRequestDto,
  ChangePasswordResponseDto,
  UserDto,
} from "@/types/api";
import type { User } from "@/types";
import { get, post, ApiError } from "@/lib/api-client";
import {
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from "@/lib/auth-storage";
import { USE_MOCK_API } from "./config";
import {
  mockLogin,
  mockSignup,
  mockForgotPassword,
  setMockSession,
  clearMockSession,
  getMockSubscription,
  setMockSubscription,
} from "@/lib/mock-auth";

const MOCK_TOKEN = "mock-jwt-token";

/** Backend GET /users/me response */
interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

/** Backend POST /auth/login and /auth/signup response (tokens only) */
interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function meToUserDto(me: MeResponse): UserDto {
  return {
    id: me.id,
    email: me.email,
    name: me.name ?? "",
    role: me.role as UserDto["role"],
    createdAt: me.createdAt,
  };
}

function userToDto(user: User): UserDto {
  return {
    id: (user as User & { id?: string }).id ?? `user-${user.email}`,
    email: user.email,
    name: user.name,
    role: (user.role as UserDto["role"]) ?? "user",
  };
}

function persistMockSession(user: User): void {
  setMockSession(user);
}

async function refreshTokens(): Promise<boolean> {
  const auth = getStoredAuth();
  if (!auth?.refreshToken) return false;
  try {
    const data = await post<TokensResponse>("auth/refresh", {
      refreshToken: auth.refreshToken,
    });
    setStoredAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    });
    return true;
  } catch {
    return false;
  }
}

async function getMe(): Promise<UserDto> {
  const auth = getStoredAuth();
  if (!auth?.accessToken) throw new ApiError("Not authenticated", 401);
  try {
    const me = await get<MeResponse>("users/me", {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    return meToUserDto(me);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const auth2 = getStoredAuth();
        if (auth2?.accessToken) {
          const me = await get<MeResponse>("users/me", {
            headers: { Authorization: `Bearer ${auth2.accessToken}` },
          });
          return meToUserDto(me);
        }
      }
      clearStoredAuth();
      throw new ApiError("Session expired", 401);
    }
    throw e;
  }
}

/**
 * Auth service. Uses real API when USE_MOCK_API is false, mock otherwise.
 */
export const authService = {
  async login(body: LoginRequestDto): Promise<LoginResponseDto> {
    if (USE_MOCK_API) {
      const result = await mockLogin(body.email, body.password);
      if (!result.success) throw new Error(result.error);
      persistMockSession(result.user);
      return {
        user: userToDto(result.user),
        accessToken: MOCK_TOKEN,
        expiresIn: 3600,
      };
    }

    const tokens = await post<TokensResponse>("auth/login", {
      email: body.email,
      password: body.password,
    });
    setStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    const user = await getMe();
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  async register(body: RegisterRequestDto): Promise<RegisterResponseDto> {
    if (USE_MOCK_API) {
      const result = await mockSignup(body.name, body.email, body.password);
      if (!result.success)
        throw new Error(result.error ?? "Registration failed");
      persistMockSession(result.user);
      return {
        user: userToDto(result.user),
        accessToken: MOCK_TOKEN,
        expiresIn: 3600,
      };
    }

    const tokens = await post<TokensResponse>("auth/signup", {
      email: body.email,
      password: body.password,
      name: body.name,
    });
    setStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    const user = await getMe();
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  async registerWithSubscription(
    body: RegisterWithSubscriptionRequestDto,
  ): Promise<RegisterResponseDto> {
    if (USE_MOCK_API) {
      const result = await mockSignup(body.name, body.email, body.password);
      if (!result.success)
        throw new Error(result.error ?? "Registration failed");
      persistMockSession(result.user);
      setMockSubscription(true);
      return {
        user: userToDto(result.user),
        accessToken: MOCK_TOKEN,
        expiresIn: 3600,
      };
    }

    const tokens = await post<TokensResponse>(
      "auth/signup-with-subscription",
      body,
    );
    setStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    const user = await getMe();
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  async createSignupSubscriptionIntent(
    body: SignupSubscriptionIntentRequestDto,
  ): Promise<SignupSubscriptionIntentResponseDto> {
    return post<SignupSubscriptionIntentResponseDto>(
      "auth/signup-subscription-intent",
      body,
    );
  },

  async finalizeSignupWithSubscription(
    body: SignupSubscriptionFinalizeRequestDto,
  ): Promise<RegisterResponseDto> {
    const tokens = await post<TokensResponse>(
      "auth/signup-subscription-finalize",
      body,
    );
    setStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    const user = await getMe();
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  },

  async forgotPassword(
    body: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    if (USE_MOCK_API) {
      const result = await mockForgotPassword(body.email);
      if (!result.success) throw new Error(result.error ?? "Request failed");
      return { message: result.message };
    }
    return post<ForgotPasswordResponseDto>("auth/forgot-password", {
      email: body.email,
    });
  },

  async resetPassword(
    body: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    if (USE_MOCK_API) {
      throw new Error("Reset password is not available in mock mode.");
    }
    return post<ResetPasswordResponseDto>("auth/reset-password", {
      token: body.token,
      newPassword: body.newPassword,
    });
  },

  async changePassword(
    body: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResponseDto> {
    if (USE_MOCK_API) {
      throw new Error("Change password is not available in mock mode.");
    }
    const auth = getStoredAuth();
    if (!auth?.accessToken) throw new ApiError("Not authenticated", 401);
    try {
      return await post<ChangePasswordResponseDto>(
        "auth/change-password",
        {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const refreshed = await refreshTokens();
        const auth2 = getStoredAuth();
        if (refreshed && auth2?.accessToken) {
          return post<ChangePasswordResponseDto>(
            "auth/change-password",
            {
              currentPassword: body.currentPassword,
              newPassword: body.newPassword,
            },
            { headers: { Authorization: `Bearer ${auth2.accessToken}` } },
          );
        }
      }
      throw err;
    }
  },

  logout(): void {
    if (!USE_MOCK_API) clearStoredAuth();
    else clearMockSession();
  },

  /**
   * Get current session. With real API: fetches user from GET /users/me using stored token.
   * Tries refresh token on 401, then returns null if still unauthenticated.
   * Throws on network/server errors so the caller can show an error state.
   */
  async getSession(): Promise<UserDto | null> {
    if (USE_MOCK_API) {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem("mockAuthUser");
        if (!raw) return null;
        const user = JSON.parse(raw) as User;
        if (!user?.email) return null;
        return userToDto(user);
      } catch {
        return null;
      }
    }

    if (typeof window === "undefined") return null;
    const auth = getStoredAuth();
    if (!auth?.accessToken) return null;

    try {
      return await getMe();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          try {
            return await getMe();
          } catch {
            // fall through to clear and return null
          }
        }
        clearStoredAuth();
        return null;
      }
      // Network or server error: let caller handle (show error state)
      throw e;
    }
  },
};

/** Used by AuthContext to read subscription from storage; see subscription.service for subscribe. */
export function getStoredSubscription(): boolean {
  return getMockSubscription();
}
