<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useCounterStore } from "../stores/counter";
import { useCounter } from "../composables/useCounter";
import { checkHealth } from "../api/health";

const counterStore = useCounterStore();
const { count } = storeToRefs(counterStore);
const { localCount, increaseLocal } = useCounter();

onMounted(async () => {
  try {
    await checkHealth();
  } catch {
    // API endpoint may not exist during early setup.
  }
});
</script>

<template>
  <section
    class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
  >
    <h2 class="text-2xl font-bold">Vue 3 + Vite + TS Setup Complete</h2>
    <p class="text-slate-600">
      已完成 Pinia、Vue Router、Fetch API 與 Tailwind CSS v4 基礎整合。
    </p>

    <div class="flex flex-wrap gap-3">
      <button
        class="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        @click="counterStore.increment()"
      >
        Pinia Count: {{ count }}
      </button>

      <button
        class="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
        @click="increaseLocal"
      >
        Composable Count: {{ localCount }}
      </button>
    </div>
  </section>
</template>
