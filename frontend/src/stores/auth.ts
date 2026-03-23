import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface UserInfo {
  name: string;
  email: string;
  picture: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserInfo | null>(null);

  const isAuthenticated = computed(() => user.value !== null);

  const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL as
    | string
    | undefined;

  function login(userInfo: UserInfo): boolean {
    if (ALLOWED_EMAIL && userInfo.email !== ALLOWED_EMAIL) {
      return false;
    }
    user.value = userInfo;
    return true;
  }

  function logout() {
    user.value = null;
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
});
