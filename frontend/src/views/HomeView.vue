<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  deleteTraining,
  type TrainingRecord,
  getTrainingMarkers,
  getTrainingsByDate,
} from "../api/trainings";
import DeleteConfirmModal from "../components/DeleteConfirmModal.vue";
import Calendar from "../components/Calendar.vue";

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const isMarkersLoading = ref(false);
const isByDateLoading = ref(false);
const isDeleting = ref(false);
const markersErrorMsg = ref("");
const byDateErrorMsg = ref("");
const isDeleteModalOpen = ref(false);
const selectedDay = ref<string | null>(null);
const trainingToDelete = ref<TrainingRecord | null>(null);
const markerDates = ref<string[]>([]);
const selectedDateTrainings = ref<TrainingRecord[]>([]);
const visibleMonth = ref(toMonthKey(new Date()));

//取得被選取月份的日期
const getTrainingMarkersForMonth = async (month: string) => {
  isMarkersLoading.value = true;
  markersErrorMsg.value = "";

  try {
    const response = await getTrainingMarkers(month);
    markerDates.value = response.dates;
  } catch {
    markerDates.value = [];
    markersErrorMsg.value = "讀取日曆標記失敗，請稍後再試。";
  } finally {
    isMarkersLoading.value = false;
  }
};

//取得選中日期的訓練紀錄
const getTrainingsForSelectedDate = async (date: string) => {
  isByDateLoading.value = true;
  byDateErrorMsg.value = "";

  try {
    const response = await getTrainingsByDate(date);
    selectedDateTrainings.value = response.trainings;
  } catch {
    selectedDateTrainings.value = [];
    byDateErrorMsg.value = "讀取當日訓練紀錄失敗，請稍後再試。";
  } finally {
    isByDateLoading.value = false;
  }
};

const deleteModalMessage = computed(() => {
  if (!trainingToDelete.value) {
    return "這筆資料刪除後無法復原，確定要繼續嗎？";
  }

  return `刪除「${trainingToDelete.value.actionName}」後將無法復原，確定要繼續嗎？`;
});

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

function openDeleteModal(training: TrainingRecord) {
  trainingToDelete.value = training;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal(force = false) {
  if (isDeleting.value && !force) {
    return;
  }
  isDeleteModalOpen.value = false;
  trainingToDelete.value = null;
}

async function confirmDeleteTraining() {
  if (!trainingToDelete.value || isDeleting.value) {
    return;
  }

  isDeleting.value = true;

  try {
    const deletedId = trainingToDelete.value.id;
    await deleteTraining(deletedId);
    selectedDateTrainings.value = selectedDateTrainings.value.filter(
      (t) => t.id !== deletedId,
    );
    if (selectedDateTrainings.value.length === 0) {
      await getTrainingMarkersForMonth(visibleMonth.value);
    }

    closeDeleteModal(true);
  } catch {
    alert("刪除失敗，請稍後再試一次");
  } finally {
    isDeleting.value = false;
  }
}
function handleMonthChange(monthKey: string) {
  if (visibleMonth.value === monthKey) {
    return;
  }

  visibleMonth.value = monthKey;
  selectedDay.value = null;
  selectedDateTrainings.value = [];
  byDateErrorMsg.value = "";
}

watch(selectedDay, (newDay) => {
  if (newDay) {
    void getTrainingsForSelectedDate(newDay);
  } else {
    selectedDateTrainings.value = [];
    byDateErrorMsg.value = "";
  }
});
watch(
  visibleMonth,
  (newMonth) => {
    void getTrainingMarkersForMonth(newMonth);
  },
  { immediate: true },
);
</script>

<template>
  <section class="w-full self-start space-y-5">
    <header class="space-y-2">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 class="text-3xl font-semibold tracking-wide text-white">
          訓練紀錄
        </h2>
        <RouterLink
          to="/trainings/new"
          class="inline-flex h-11 items-center justify-center rounded-md bg-[#7de8ef] px-4 text-sm font-semibold tracking-[0.12em] text-[#174452] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff]"
        >
          Create Record
        </RouterLink>
      </div>
    </header>
    <Calendar
      v-model="selectedDay"
      :marker-dates="markerDates"
      @month-change="handleMonthChange"
    />
    <p v-if="!selectedDay" class="text-lg text-[#8aa3bc]">
      請先在日曆中點選有訓練的日期
    </p>

    <p v-if="isMarkersLoading" class="text-sm text-[#8aa3bc]">
      正在更新本月訓練標記...
    </p>

    <div
      v-if="markersErrorMsg"
      class="rounded-md border border-[#46303d] bg-[#2a1820]/70 p-5 text-[#ffb7c4]"
    >
      <p class="text-sm">{{ markersErrorMsg }}</p>
      <button
        class="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-[#ff8fa0] px-4 text-sm font-medium text-[#ffcad4] hover:bg-[#ff8fa0]/10"
        type="button"
        @click="getTrainingMarkersForMonth(visibleMonth)"
      >
        重試
      </button>
    </div>

    <div v-if="selectedDay && isByDateLoading" class="space-y-4">
      <article
        v-for="index in 3"
        :key="index"
        class="h-44 animate-pulse rounded-md border border-[#1f2e3f] bg-[#0e1522]/80"
      />
    </div>

    <div
      v-else-if="byDateErrorMsg"
      class="rounded-md border border-[#46303d] bg-[#2a1820]/70 p-5 text-[#ffb7c4]"
    >
      <p class="text-sm">{{ byDateErrorMsg }}</p>
      <button
        class="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-[#ff8fa0] px-4 text-sm font-medium text-[#ffcad4] hover:bg-[#ff8fa0]/10"
        type="button"
        @click="selectedDay && getTrainingsForSelectedDate(selectedDay)"
      >
        重試
      </button>
    </div>

    <div v-else class="space-y-4">
      <template v-if="selectedDay">
        <p class="text-lg text-[#8aa3bc]">
          <span class="text-[#8FF5FF] font-bold">{{ selectedDay }}</span>
          的訓練紀錄，共
          <span class="text-[#8FF5FF] font-bold">{{
            selectedDateTrainings.length
          }}</span>
          筆
        </p>

        <p
          v-if="selectedDateTrainings.length === 0"
          class="rounded-md border border-[#1e3445] bg-[#0e1725]/70 p-4 text-[#d7e7f4]"
        >
          此日期沒有訓練紀錄
        </p>

        <article
          v-for="training in selectedDateTrainings"
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
              <p
                class="mt-1 text-xs uppercase tracking-[0.12em] text-[#7c93ad]"
              >
                TIME_STAMP: {{ formatTimestamp(training.performedAt) }}
              </p>
            </div>
            <div class="flex gap-2">
              <RouterLink
                :to="`/trainings/edit/${training.id}`"
                class="inline-flex w-[32px] h-[32px] items-center justify-center rounded-sm border border-[#8FF5FF] bg-transparent text-[#8FF5FF] transition hover:bg-[#8FF5FF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FF5FF] cursor-pointer"
              >
                <span class="material-symbols-outlined edit-icon">edit</span>
              </RouterLink>

              <button
                aria-label="Delete"
                class="inline-flex w-[32px] h-[32px] items-center justify-center rounded-sm border border-[#FF716C] bg-transparent text-[#FF716C] transition hover:bg-[#FF716C]/10 focus-visible:outline-none focus-visible:ring-[#FF716C] cursor-pointer"
                type="button"
                @click="openDeleteModal(training)"
              >
                <span class="material-symbols-outlined delete-icon"
                  >delete</span
                >
              </button>
            </div>
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
      </template>
    </div>

    <DeleteConfirmModal
      :open="isDeleteModalOpen"
      title="刪除訓練紀錄"
      :message="deleteModalMessage"
      confirm-text="確認"
      cancel-text="取消"
      :is-processing="isDeleting"
      @close="closeDeleteModal"
      @confirm="confirmDeleteTraining"
    />
  </section>
</template>
<style scoped>
.delete-icon {
  font-size: 22px;
}
.edit-icon {
  font-size: 20px;
}
</style>
