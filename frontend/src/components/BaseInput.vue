<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  id: { type: String, default: undefined },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: undefined },
  inputmode: {
    type: String as PropType<
      | "text"
      | "search"
      | "none"
      | "tel"
      | "url"
      | "email"
      | "numeric"
      | "decimal"
      | undefined
    >,
    default: undefined,
  },
  min: {
    type: [String, Number] as PropType<string | number | undefined>,
    default: undefined,
  },
  step: {
    type: [String, Number] as PropType<string | number | undefined>,
    default: undefined,
  },
  rows: { type: Number as PropType<number>, default: 4 },
  as: { type: String as PropType<"input" | "textarea">, default: "input" }, // 'input' or 'textarea'
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "input", value: string | number): void;
}>();

const inputClass =
  "box-border w-full rounded-md border border-[#45484f] bg-[#1c2028] p-3 text-base text-[#8ff5ff] outline-none placeholder:text-[#a9abb3] focus:border-[#8ff5ff] focus:shadow-[0_0_0_1px_rgba(143,245,255,0.4)]";

function updateValue(v: string | number) {
  emit("update:modelValue", v);
  emit("input", v);
}

function handleInput(e: Event) {
  const t = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
  updateValue(t.value);
}
</script>

<template>
  <input
    v-if="as === 'input'"
    :id="id"
    :type="type"
    :placeholder="placeholder"
    :inputmode="inputmode"
    :min="min"
    :step="step"
    :value="modelValue"
    :class="inputClass"
    @input="handleInput"
    v-bind="$attrs"
  />

  <textarea
    v-else
    :id="id"
    :rows="rows"
    :placeholder="placeholder"
    :class="[inputClass, 'min-h-[108px] resize-y']"
    :value="modelValue"
    @input="handleInput"
    v-bind="$attrs"
  />
</template>
