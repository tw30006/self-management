<script setup lang="ts">
import { ref } from "vue";

const attributes = ref([
  {
    key: "today",
    highlight: "red",
    dates: new Date(),
  },
]);
</script>
<template>
  <div class="my-calendar">
    <VCalendar :attributes="attributes" is-dark />
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
</style>
