/**
 * Service layer configuration.
 * Set NEXT_PUBLIC_USE_MOCK_API=false and implement real API calls in each service
 * when the backend is ready.
 */
import { getUseMockApi } from "@/lib/env";

export const USE_MOCK_API = getUseMockApi();
