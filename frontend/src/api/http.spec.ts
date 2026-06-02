import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiRequestError,
  apiGet,
  apiPost,
  buildApiUrl,
} from "./http";

function jsonResponse(
  body: unknown,
  init: { status?: number; ok?: boolean } = {},
): Response {
  const status = init.status ?? 200;
  return {
    status,
    ok: init.ok ?? (status >= 200 && status < 300),
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
  } as unknown as Response;
}

function emptyResponse(status: number): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => {
      throw new Error("should not parse body");
    },
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildApiUrl", () => {
  it("預設 base 為 /api，會補上前導斜線", () => {
    expect(buildApiUrl("trainings")).toBe("/api/trainings");
    expect(buildApiUrl("/trainings")).toBe("/api/trainings");
  });

  it("base 結尾的斜線不會造成雙斜線", () => {
    expect(buildApiUrl("/trainings/1")).toBe("/api/trainings/1");
  });
});

describe("request 行為", () => {
  it("成功時回傳 envelope 內的 data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: { id: 1 }, error: null }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGet<{ id: number }>("/trainings/1");

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trainings/1",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("204 No Content 直接回傳 undefined，不解析 body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiGet<void>("/trainings/1");

    expect(result).toBeUndefined();
  });

  it("HTTP 錯誤時拋出帶 status 與 code 的 ApiRequestError", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "找不到資料" },
        },
        { status: 404 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = (await apiGet("/trainings/999").catch(
      (e) => e,
    )) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("找不到資料");
  });

  it("回應成功但 success=false 時視為無效回應並拋錯", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: false, data: null, error: null }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const error = (await apiGet("/trainings").catch(
      (e) => e,
    )) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.message).toBe("Invalid API response");
  });

  it("非 JSON 的錯誤回應使用預設訊息", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      headers: new Headers({ "content-type": "text/html" }),
      json: async () => {
        throw new Error("should not parse body");
      },
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    const error = (await apiGet("/trainings").catch(
      (e) => e,
    )) as ApiRequestError;

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("Request failed");
  });

  it("apiPost 會帶上 method、序列化 body 與 JSON header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, data: { id: 9 }, error: null }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await apiPost("/trainings", { actionName: "Bench" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ actionName: "Bench" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});
