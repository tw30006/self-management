import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getMe, logout as logoutRequest, type AuthUser } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const isHydrated = ref(false);

  const isAuthenticated = computed(() => user.value !== null);

  async function hydrateSession(force = false) {
    if (isHydrated.value && !force) {
      return;
    }

    try {
      user.value = await getMe();
    } catch {
      user.value = null;
    } finally {
      isHydrated.value = true;
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Session may already be invalidated.
    }

    user.value = null;
    isHydrated.value = true;
  }

  return {
    user,
    isHydrated,
    isAuthenticated,
    hydrateSession,
    logout,
  };
});
