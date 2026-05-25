import { get, patch, ApiError } from "@/lib/api-client";
import { getStoredAuth } from "@/lib/auth-storage";
import { authService } from "@/lib/services/auth.service";
import type { AdConfigDto, UpdateAdConfigDto } from "@/types/api";

function authHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  if (!auth?.accessToken) return {};
  return { Authorization: `Bearer ${auth.accessToken}` };
}

async function withAuthRetry<T>(
  request: (headers: Record<string, string>) => Promise<T>
): Promise<T> {
  const headers = authHeaders();
  if (!headers.Authorization) throw new ApiError("Not authenticated", 401);

  try {
    return await request(headers);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await authService.getSession();
      const refreshed = authHeaders();
      if (!refreshed.Authorization)
        throw new ApiError("Not authenticated", 401);
      return request(refreshed);
    }
    throw err;
  }
}

/**
 * Frontend service for the AdButler / ad-network config.
 *
 * Public endpoint  → GET  /ad-config         (no auth — for the web player)
 * Admin endpoints  → GET  /ad-config/admin   (admin panel read)
 *                    PATCH /ad-config/admin  (admin panel write)
 */
class AdConfigService {
  /**
   * Fetches the public-safe ad config the web player uses to decide whether
   * and how to display ads.  No auth token required.
   */
  async getPublicAdConfig(): Promise<AdConfigDto> {
    return get<AdConfigDto>("/ad-config");
  }

  /**
   * Fetches the full ad config for the admin settings panel.
   * Requires a valid admin JWT (set by the api-client interceptor).
   */
  async getAdminAdConfig(): Promise<AdConfigDto> {
    return withAuthRetry((headers) =>
      get<AdConfigDto>("/ad-config/admin", { headers })
    );
  }

  /**
   * Partially updates the ad config singleton.
   * Only sends fields that have changed — all fields are optional.
   */
  async updateAdConfig(payload: UpdateAdConfigDto): Promise<AdConfigDto> {
    return withAuthRetry((headers) =>
      patch<AdConfigDto>("/ad-config/admin", payload, { headers })
    );
  }
}

export const adConfigService = new AdConfigService();
