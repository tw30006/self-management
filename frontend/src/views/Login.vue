<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div
      class="bg-white rounded-2xl shadow-md px-10 py-12 flex flex-col items-center gap-6 w-full max-w-sm"
    >
      <h1 class="text-2xl font-semibold text-gray-800 tracking-tight">
        Welcome
      </h1>
      <p class="text-sm text-gray-500">請使用 Google 帳號登入</p>

      <div ref="googleBtnRef" class="w-full flex justify-center" />

      <p v-if="errorMsg" class="text-sm text-red-500 text-center">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace accounts {
    namespace id {
      function initialize(config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }): void;
      function renderButton(
        element: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          width?: number;
          text?: string;
          shape?: string;
          logo_alignment?: string;
        },
      ): void;
    }
  }
}

const router = useRouter();
const authStore = useAuthStore();
const googleBtnRef = ref<HTMLElement | null>(null);
const errorMsg = ref("");

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}

function handleCredentialResponse(response: { credential: string }) {
  errorMsg.value = "";
  try {
    const payload = decodeJwt(response.credential) as {
      email?: string;
      name?: string;
      picture?: string;
    };

    const success = authStore.login({
      email: payload.email ?? "",
      name: payload.name ?? "",
      picture: payload.picture ?? "",
    });

    if (success) {
      router.push("/");
    } else {
      errorMsg.value = "此帳號不在允許名單內，請使用指定的 Google 帳號登入。";
    }
  } catch {
    errorMsg.value = "登入失敗，請稍後再試。";
  }
}

function initGSI() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    errorMsg.value = "未設定 Google Client ID，請聯絡管理員。";
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse,
  });

  if (googleBtnRef.value) {
    window.google.accounts.id.renderButton(googleBtnRef.value, {
      theme: "outline",
      size: "large",
      width: 280,
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "left",
    });
  }
}

onMounted(() => {
  if (window.google?.accounts?.id) {
    initGSI();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = initGSI;
  script.onerror = () => {
    errorMsg.value = "無法載入 Google 登入服務，請確認網路連線。";
  };
  document.head.appendChild(script);
});
</script>
