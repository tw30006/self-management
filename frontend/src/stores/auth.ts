import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getMe, logout as logoutRequest, type AuthUser } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AuthUser | null>(null);
  const isSessionChecked = ref(false);

  const isLoggedIn = computed(() => user.value !== null);

  async function checkSession(forceRefresh = false) {
    if (isSessionChecked.value && !forceRefresh) {
      return;
    }

    try {
      user.value = await getMe();
    } catch {
      user.value = null;
    } finally {
      isSessionChecked.value = true;
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch {
      // Session may already be invalidated.
    }

    user.value = null;
    isSessionChecked.value = true;
  }

  return {
    user,
    isSessionChecked,
    isLoggedIn,
    checkSession,
    logout,
  };
});
