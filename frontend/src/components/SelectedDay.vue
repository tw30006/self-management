<script setup lang="ts">
const props = defineProps<{ modelValue: string | null }>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

function onDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value || null);
}
</script>

<template>
  <input
    type="date"
    class="bg-gray-500 rounded-md p-2"
    :value="props.modelValue ?? ''"
    @input="onDateInput"
  />
</template>
