<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getTrainings,
  type TrainingRecord,
  type TrainingsPaginationMeta,
} from "../api/trainings";

const trainings = ref<TrainingRecord[]>([]);
const isLoading = ref(false);
const errorMsg = ref("");
const pagination = ref<TrainingsPaginationMeta>({
  total: 0,
  page: 1,
  limit: 20,
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)),
);
const canGoPrev = computed(() => pagination.value.page > 1);
const canGoNext = computed(() => pagination.value.page < totalPages.value);

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  const datePart = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${datePart} ${timePart}`;
}

function formatWeight(weight: string) {
  const value = Number(weight);
  if (!Number.isFinite(value)) {
    return `${weight} kg`;
  }

  return `${value.toFixed(1)} kg`;
}

async function fetchTrainings(page = 1) {
  isLoading.value = true;
  errorMsg.value = "";

  try {
    const response = await getTrainings(page, pagination.value.limit);
    trainings.value = response.trainings;
    pagination.value = response.meta;
  } catch {
    errorMsg.value = "讀取訓練紀錄失敗，請稍後再試。";
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void fetchTrainings();
});
</script>

<template>
  <section class="w-full self-start space-y-5">
    <header class="space-y-2">
      <p class="text-xs uppercase tracking-[0.18em] text-[#8ff5ff]">
        Telemetry stream active // protocol_441
      </p>
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 class="text-3xl font-semibold tracking-wide text-white">
          訓練紀錄
        </h2>
        <RouterLink
          to="/trainings/new"
          class="inline-flex h-11 items-center justify-center rounded-md bg-[#7de8ef] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#174452] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]"
        >
          新增
        </RouterLink>
      </div>
    </header>

    <div v-if="isLoading" class="space-y-4">
      <article
        v-for="index in 3"
        :key="index"
        class="h-44 animate-pulse rounded-md border border-[#1f2e3f] bg-[#0e1522]/80"
      />
    </div>

    <div
      v-else-if="errorMsg"
      class="rounded-md border border-[#46303d] bg-[#2a1820]/70 p-5 text-[#ffb7c4]"
    >
      <p class="text-sm">{{ errorMsg }}</p>
      <button
        class="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-[#ff8fa0] px-4 text-sm font-medium text-[#ffcad4] hover:bg-[#ff8fa0]/10"
        type="button"
        @click="fetchTrainings(pagination.page)"
      >
        重試
      </button>
    </div>

    <div
      v-else-if="trainings.length === 0"
      class="rounded-md border border-[#1e3445] bg-[#0e1725]/70 p-6 text-center"
    >
      <p class="text-lg font-medium text-[#d7e7f4]">目前沒有訓練紀錄</p>
      <p class="mt-1 text-sm text-[#8aa3bc]">
        建立第一筆紀錄開始追蹤你的訓練進度
      </p>
      <RouterLink
        to="/trainings/new"
        class="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#7de8ef] px-4 text-sm font-semibold uppercase tracking-[0.1em] text-[#174452] hover:brightness-105"
      >
        建立第一筆
      </RouterLink>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="training in trainings"
        :key="training.id"
        class="rounded-md border border-[#1f2e3f] bg-gradient-to-r from-[#0c1220] to-[#101a2b] px-4 py-5 shadow-[inset_0_0_0_1px_rgba(143,245,255,0.05)] sm:px-6"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3
              class="text-2xl font-semibold uppercase tracking-[0.04em] text-[#e9f4ff]"
            >
              {{ training.actionName }}
            </h3>
            <p class="mt-1 text-xs uppercase tracking-[0.12em] text-[#7c93ad]">
              TIME_STAMP: {{ formatTimestamp(training.performedAt) }}
            </p>
          </div>
          <p class="text-[11px] uppercase tracking-[0.12em] text-[#4e657d]">
            REF_{{ training.id }}
          </p>
        </div>

        <div
          class="mt-5 grid grid-cols-3 divide-x divide-[#172435] border-y border-[#162638] py-4"
        >
          <div class="px-3 text-center">
            <p class="text-[10px] uppercase tracking-[0.18em] text-[#607a96]">
              SETS
            </p>
            <p class="mt-1 text-3xl font-semibold text-[#edf3fb]">
              {{ training.sets }}
            </p>
          </div>
          <div class="px-3 text-center">
            <p class="text-[10px] uppercase tracking-[0.18em] text-[#607a96]">
              REPS
            </p>
            <p class="mt-1 text-3xl font-semibold text-[#edf3fb]">
              {{ training.reps }}
            </p>
          </div>
          <div class="px-3 text-center">
            <p class="text-[10px] uppercase tracking-[0.18em] text-[#607a96]">
              WEIGHT
            </p>
            <p class="mt-1 text-3xl font-semibold text-[#7de8ef]">
              {{ formatWeight(training.weight) }}
            </p>
          </div>
        </div>

        <div
          class="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <p v-if="training.heartRate !== null" class="text-[#b6a4ff]">
            ♡ {{ training.heartRate }} BPM
          </p>
          <p v-if="training.notes" class="sm:ml-auto text-[#9caec0] italic">
            "{{ training.notes }}"
          </p>
        </div>
      </article>

      <nav
        class="flex items-center justify-between rounded-md border border-[#1a2e40] bg-[#0b1524]/70 px-4 py-3 text-sm text-[#a8bdd2]"
      >
        <button
          class="rounded-md border border-[#2b465f] px-3 py-1.5 transition hover:border-[#8ff5ff] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!canGoPrev"
          @click="fetchTrainings(pagination.page - 1)"
        >
          上一頁
        </button>

        <p>
          第 {{ pagination.page }} / {{ totalPages }} 頁 • 共
          {{ pagination.total }} 筆
        </p>

        <button
          class="rounded-md border border-[#2b465f] px-3 py-1.5 transition hover:border-[#8ff5ff] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!canGoNext"
          @click="fetchTrainings(pagination.page + 1)"
        >
          下一頁
        </button>
      </nav>
    </div>
  </section>
</template>
