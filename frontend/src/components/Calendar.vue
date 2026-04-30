<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    markerDates: string[];
  }>(),
  {
    markerDates: () => [],
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "month-change", value: string): void;
}>();

type CalendarDayClick = {
  id: string;
  date: Date;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Reject overflow dates like 2026-02-31 that JS Date would auto-correct.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const markerDateSet = computed(() => new Set(props.markerDates));

const today = new Date();
const visibleYear = ref(today.getFullYear());
const visibleMonth = ref(today.getMonth());

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getAllDatesInMonth = (year: number, month: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from(
    { length: lastDay },
    (_, index) => new Date(year, month, index + 1),
  );
};

function handleDidMove(pages: Array<{ year: number; month: number }>) {
  const currentPage = pages[0];
  if (!currentPage) {
    return;
  }

  visibleYear.value = currentPage.year;
  visibleMonth.value = currentPage.month - 1;
  const monthKey = `${visibleYear.value}-${(visibleMonth.value + 1).toString().padStart(2, "0")}`;
  emit("month-change", monthKey);
}

function handleDayClick(day: CalendarDayClick) {
  const dateKey = day.id;
  if (markerDateSet.value.has(dateKey)) {
    emit("update:modelValue", dateKey);
    return;
  }

  emit("update:modelValue", null);
}

const attributes = computed(() => {
  const trainingDayDates = props.markerDates
    .map(parseDateKey)
    .filter((date): date is Date => date !== null);

  const monthDates = getAllDatesInMonth(visibleYear.value, visibleMonth.value);
  const nonTrainingDayDates = monthDates.filter(
    (date) => !markerDateSet.value.has(toDateKey(date)),
  );

  return [
    {
      key: "non-training-days",
      dates: nonTrainingDayDates,
      highlight: {
        fillMode: "light",
        color: "gray",
      },
      popover: false,
    },
    {
      key: "training-days",
      dates: trainingDayDates,
      highlight: {
        fillMode: "light",
        color: "red",
      },
      popover: false,
    },
    {
      key: "today",
      dates: new Date(),
      highlight: {
        fillMode: "solid",
        color: "blue",
      },
    },
  ];
});
</script>
<template>
  <div class="my-calendar">
    <VCalendar
      :attributes="attributes"
      is-dark
      @dayclick="handleDayClick"
      @did-move="handleDidMove"
    />
  </div>
  <div class="text-sm text-gray-400 flex items-center gap-4">
    <span class="flex items-center">
      <span class="w-3 h-3 bg-[#991b1b] rounded-full mr-1"></span>
      訓練日期
    </span>
    <span class="flex items-center">
      <span class="w-3 h-3 bg-[#3b82f6] rounded-full mr-1"></span>
      今天
    </span>
  </div>
</template>

<style scoped>
.my-calendar {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  max-width: 500px;
}
.my-calendar :deep(.vc-container) {
  background-color: #1f2e45;
  color: #ffffff;
  width: 100%;
}

.my-calendar :deep(.vc-title),
.my-calendar :deep(.vc-arrow) {
  color: #e2e8f0;
}

/* 週標題與日期 */
.my-calendar :deep(.vc-weekday) {
  color: #1584df;
}

.my-calendar :deep(.vc-day-content) {
  color: #ffffff;
}

/* 點開月份/年份選單的樣式 */
.my-calendar :deep(.vc-popover-content),
.my-calendar :deep(.vc-nav-popover-container) {
  background: #1f2e45;
  border: 1px solid #334155;
  color: #e2e8f0;
}

.my-calendar :deep(.vc-nav-item) {
  color: #e2e8f0;
}

.my-calendar :deep(.vc-day-content:hover) {
  background: rgba(125, 232, 239, 0.2);
}

/* .my-calendar :deep(.vc-day.is-selected .vc-day-content) {
  background: #7de8ef;
  color: #0f172a;
} */
</style>
