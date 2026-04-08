<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div
      class="bg-white rounded-2xl shadow-md px-10 py-12 flex flex-col items-center gap-6 w-full max-w-sm"
    >
      <h1 class="text-2xl font-semibold text-gray-800 tracking-tight">
        Welcome
      </h1>
      <p class="text-sm text-gray-500">請使用 Google 帳號登入</p>

      <button
        class="w-full rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-700"
        type="button"
        @click="loginWithGoogle"
      >
        使用 Google 登入
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
