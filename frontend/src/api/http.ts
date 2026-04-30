//定義Api錯誤回報的架構
export interface ApiErrorPayload {
  code: string;
  message: string;
}

//判斷Api封裝回傳的資料架構
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

//定義Api請求錯誤的類別，使用extends延伸Error類別，新增status和code屬性，呼叫父類別的建構函數，並設定name、status和code屬性。
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

//從.env檔案取出api的URL，並定義ApiUrl的建構函數
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
function buildApiUrl(path: string): string {
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

//建立共用的request函式，接受API路徑和RequestInit參數，回傳泛型T的Promise
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

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
export function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "DELETE", ...init });
}

export { API_BASE_URL, buildApiUrl };
