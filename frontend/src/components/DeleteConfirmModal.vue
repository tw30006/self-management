<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isProcessing?: boolean;
  }>(),
  {
    title: "確認刪除",
    message: "這筆資料刪除後無法復原，確定要繼續嗎？",
    confirmText: "確認",
    cancelText: "取消",
    isProcessing: false,
  },
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();

function handleClose() {
  if (props.isProcessing) {
    return;
  }

  emit("close");
}

function handleConfirm() {
  if (props.isProcessing) {
    return;
  }

  emit("confirm");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#060b12]/70 px-4 backdrop-blur-[2px]"
      @click.self="handleClose"
    >
      <section
        class="w-full max-w-md rounded-lg border border-[#294259] bg-gradient-to-b from-[#111b2b] to-[#0c1523] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold tracking-[0.04em] text-[#eaf3ff]">
              {{ title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[#9fb4cb]">
              {{ message }}
            </p>
          </div>

          <button
            type="button"
            aria-label="關閉"
            class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#31516c] text-[#9fd0ff] transition hover:bg-[#8ff5ff]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isProcessing"
            @click="handleClose"
          >
            <span class="material-symbols-outlined close-icon">close</span>
          </button>
        </header>

        <footer class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border border-[#3b556d] px-4 text-sm font-medium text-[#c6d8ea] transition hover:border-[#8ff5ff] hover:text-[#e7f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isProcessing"
            @click="handleClose"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-md border border-[#ff716c] bg-[#351b23] px-4 text-sm font-semibold text-[#ffd4d3] transition hover:bg-[#4a212d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8f8b] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isProcessing"
            @click="handleConfirm"
          >
            {{ isProcessing ? "刪除中..." : confirmText }}
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.close-icon {
  font-size: 20px;
}
</style>
