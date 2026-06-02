import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";

const getMeMock = vi.fn();

vi.mock("../api/auth", () => ({
  getMe: () => getMeMock(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

async function buildRouter(loggedIn: boolean) {
  if (loggedIn) {
    getMeMock.mockResolvedValue({ id: 1, name: "tester" });
  } else {
    getMeMock.mockRejectedValue(new Error("unauthenticated"));
  }

  setActivePinia(createPinia());
  const { routes, authGuard } = await import("./index");
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  router.beforeEach(authGuard);
  return router;
}

describe("router guard：requiresAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登入時進入受保護頁會被導向 login", async () => {
    const router = await buildRouter(false);

    await router.push("/trainings/new");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
  });

  it("已登入時可以進入受保護頁", async () => {
    const router = await buildRouter(true);

    await router.push("/trainings/new");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("training-create");
  });

  it("已登入時進入 login 會被導回 home", async () => {
    const router = await buildRouter(true);

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("home");
  });
});
