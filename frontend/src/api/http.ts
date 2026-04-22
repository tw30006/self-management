export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
function buildApiUrl(path: string): string {
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiEnvelope<T>)
    : null;

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.error?.message ?? "Request failed",
      response.status,
      payload?.error?.code,
    );
  }

  if (!payload?.success || payload.data === null) {
    throw new ApiRequestError(
      payload?.error?.message ?? "Invalid API response",
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data;
}

export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "GET", ...init });
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}
export function apiEdit<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}

export { API_BASE_URL, buildApiUrl };
