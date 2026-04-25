/**
 * Centralized API client using fetch.
 * Base URL from NEXT_PUBLIC_API_BASE_URL. Handles JSON requests, responses, and errors globally.
 */
import { getApiBaseUrl } from "@/lib/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** User-friendly message from API errors (handles NestJS validation message arrays). */
export function getApiErrorMessage(err: unknown): string {
  if (
    err instanceof ApiError &&
    err.body &&
    typeof err.body === "object" &&
    "message" in err.body
  ) {
    const msg = (err.body as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join(" ");
    if (typeof msg === "string") return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

/**
 * User-friendly message for global display (auth, subscription, server, network).
 * Use for banners/toasts; use getApiErrorMessage for form-level display.
 */
export function getApiErrorUserMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    if (err instanceof Error) {
      if (
        err.message.includes("fetch") ||
        err.message.includes("network") ||
        err.message.includes("Failed to fetch")
      )
        return "Network error. Check your connection and try again.";
      return err.message;
    }
    return "Something went wrong. Please try again.";
  }
  if (err.status === 0)
    return "Network error. Check your connection and try again.";
  switch (err.status) {
    case 401:
      return (
        (err.body &&
        typeof err.body === "object" &&
        "message" in err.body &&
        typeof (err.body as { message: unknown }).message === "string"
          ? (err.body as { message: string }).message
          : null) ?? "Your session may have expired. Please sign in again."
      );
    case 403:
      return (
        (err.body &&
        typeof err.body === "object" &&
        "message" in err.body &&
        typeof (err.body as { message: unknown }).message === "string"
          ? (err.body as { message: string }).message
          : null) ??
        "You don’t have permission to do that. An active subscription may be required."
      );
    case 404:
      return "The requested resource was not found.";
    case 500:
    case 502:
    case 503:
      return "Our servers are having trouble. Please try again in a moment.";
    default:
      if (err.status >= 500)
        return "Something went wrong on our end. Please try again.";
      if (err.status >= 400) return getApiErrorMessage(err);
      return "Something went wrong. Please try again.";
  }
}

/** Callback for global API error reporting (set by ApiErrorProvider). */
let globalApiErrorHandler: ((err: ApiError) => void) | null = null;

export function setGlobalApiErrorHandler(
  handler: ((err: ApiError) => void) | null
): void {
  globalApiErrorHandler = handler;
}

function notifyGlobalHandler(err: ApiError): void {
  try {
    globalApiErrorHandler?.(err);
  } catch {
    // ignore handler errors
  }
}

type RequestConfig = RequestInit & {
  params?: Record<string, string>;
};

function toBodyInit(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${base}${normalizedPath}`;
  if (params && Object.keys(params).length > 0) {
    const search = new URLSearchParams(params).toString();
    url += `?${search}`;
  }
  return url;
}

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, headers: customHeaders, body, ...rest } = config;
  const url = buildUrl(path, params);
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...customHeaders,
  };
  const init: RequestInit = {
    ...rest,
    headers,
    body:
      body !== undefined && body !== null
        ? typeof body === "string"
          ? body
          : JSON.stringify(body)
        : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (fetchErr) {
    const message =
      fetchErr instanceof Error ? fetchErr.message : "Network request failed";
    const apiError = new ApiError(message, 0, undefined);
    notifyGlobalHandler(apiError);
    throw apiError;
  }

  let parsed: unknown;
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  } else {
    const text = await response.text();
    parsed = text || null;
  }

  if (!response.ok) {
    const message =
      parsed &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : response.statusText ||
          `Request failed with status ${response.status}`;
    const apiError = new ApiError(message, response.status, parsed);
    notifyGlobalHandler(apiError);
    throw apiError;
  }

  return parsed as T;
}

/** GET request. */
export function get<T>(
  path: string,
  config?: Omit<RequestConfig, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...config, method: "GET" });
}

/** POST request. */
export function post<T>(
  path: string,
  body?: unknown,
  config?: Omit<RequestConfig, "method" | "body">
): Promise<T> {
  return request<T>(path, {
    ...config,
    method: "POST",
    body: toBodyInit(body),
  });
}

/** PUT request. */
export function put<T>(
  path: string,
  body?: unknown,
  config?: Omit<RequestConfig, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...config, method: "PUT", body: toBodyInit(body) });
}

/** PATCH request. */
export function patch<T>(
  path: string,
  body?: unknown,
  config?: Omit<RequestConfig, "method" | "body">
): Promise<T> {
  return request<T>(path, {
    ...config,
    method: "PATCH",
    body: toBodyInit(body),
  });
}

/** DELETE request. */
export function del<T>(
  path: string,
  config?: Omit<RequestConfig, "method" | "body">
): Promise<T> {
  return request<T>(path, { ...config, method: "DELETE" });
}
