<template>
  <div class="flex items-center justify-center h-full">
    <div
      class="bg-white rounded-2xl shadow-md px-10 py-12 flex flex-col items-center gap-6 w-[330px] lg:w-[400px]"
    >
      <h1 class="text-2xl font-semibold text-gray-800 tracking-tight">
        Welcome
      </h1>
      <p class="text-sm text-gray-500">請使用 Google 帳號登入</p>

      <button
        class="w-full rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-700 flex items-center justify-center gap-2 cursor-pointer"
        type="button"
        @click="loginWithGoogle"
      >
        <svg
          class="w-5 h-5"
          viewBox="0 0 533.5 544.3"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="#4285F4"
            d="M533.5 278.4c0-17.9-1.6-35.1-4.6-51.8H272v98h146.9c-6.3 34.1-25.2 63-53.6 82.3v68.3h86.6c50.6-46.6 81.6-115.3 81.6-196.8z"
          />
          <path
            fill="#34A853"
            d="M272 544.3c72.6 0 133.6-24.1 178.2-65.6l-86.6-68.3c-24.1 16.2-55 25.8-91.6 25.8-70.6 0-130.4-47.6-151.8-111.5H31.7v69.9C75.9 479 167.5 544.3 272 544.3z"
          />
          <path
            fill="#FBBC05"
            d="M120.2 325.7c-10.9-32.6-10.9-67.7 0-100.3V155.5H31.7c-39 76.7-39 167.1 0 243.8l88.5-73.6z"
          />
          <path
            fill="#EA4335"
            d="M272 107.7c39.5-.6 75.7 14.2 103.9 40.9l77.9-77.9C405.6 24.8 344.6 0 272 0 167.5 0 75.9 65.3 31.7 155.5l88.5 69.9c21.4-63.9 81.2-111.5 151.8-111.5z"
          />
        </svg>
        <span class="font-bold">登入</span>
      </button>

      <p v-if="errorMsg" class="text-sm text-red-500 text-center">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { buildApiUrl } from "../api/http";

const router = useRouter();
const errorMsg = ref("");

function loginWithGoogle() {
  window.location.assign(buildApiUrl("/auth/google"));
}

onMounted(() => {
  if (router.currentRoute.value.query.error === "oauth_failed") {
    errorMsg.value = "Google 登入失敗，請稍後再試。";
  }
});
</script>
