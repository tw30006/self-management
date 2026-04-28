<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    trainingDates: string[];
  }>(),
  {
    trainingDates: () => [],
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
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

const trainingDateSet = computed(() => new Set(props.trainingDates));

function handleDayClick(day: CalendarDayClick) {
  const dateKey = day.id;
  if (trainingDateSet.value.has(dateKey)) {
    emit("update:modelValue", dateKey);
    return;
  }

  emit("update:modelValue", null);
}

const attributes = computed(() => {
  const trainingDayDates = props.trainingDates
    .map(parseDateKey)
    .filter((date): date is Date => date !== null);

  const selectedDate = props.modelValue ? parseDateKey(props.modelValue) : null;

  return [
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
    {
      key: "selected-day",
      dates: selectedDate ?? [],
      contentStyle: {
        color: "#0f172a",
      },
    },
  ];
});
</script>
<template>
  <div class="my-calendar">
    <VCalendar :attributes="attributes" is-dark @dayclick="handleDayClick" />
  </div>
</template>

<style scoped>
.my-calendar {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  max-width: 500px;
  margin: 0 auto;
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
