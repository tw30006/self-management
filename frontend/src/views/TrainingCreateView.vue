<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { createTraining, type CreateTrainingPayload } from "../api/trainings";
import BaseInput from "../components/BaseInput.vue";

interface TrainingFormState {
  performedAt: string;
  actionName: string;
  sets: string;
  reps: string;
  weight: string;
  heartRate: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof TrainingFormState, string>>;

const form = reactive<TrainingFormState>({
  performedAt: "",
  actionName: "",
  sets: "",
  reps: "",
  weight: "",
  heartRate: "",
  notes: "",
});

const errors = reactive<FormErrors>({});
const submitError = ref("");
const submitSuccess = ref("");
const isSubmitting = ref(false);

const hasAnyError = computed(() => Object.keys(errors).length > 0);

function clearMessages() {
  submitError.value = "";
  submitSuccess.value = "";
}

function clearForm() {
  form.performedAt = "";
  form.actionName = "";
  form.sets = "";
  form.reps = "";
  form.weight = "";
  form.heartRate = "";
  form.notes = "";
  for (const key of Object.keys(errors) as Array<keyof TrainingFormState>) {
    delete errors[key];
  }
  clearMessages();
}

function validateForm(): boolean {
  for (const key of Object.keys(errors) as Array<keyof TrainingFormState>) {
    delete errors[key];
  }

  if (!form.performedAt) {
    errors.performedAt = "請輸入訓練時間";
  }

  if (!form.actionName.trim()) {
    errors.actionName = "動作名稱不能為空";
  }

  const parsedSets = Number(form.sets);
  if (!Number.isInteger(parsedSets) || parsedSets <= 0) {
    errors.sets = "組數必須為正整數";
  }

  const parsedReps = Number(form.reps);
  if (!Number.isInteger(parsedReps) || parsedReps <= 0) {
    errors.reps = "次數必須為正整數";
  }

  const parsedWeight = Number(form.weight);
  if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
    errors.weight = "重量必須為正數";
  }

  if (form.heartRate.trim()) {
    const parsedHeartRate = Number(form.heartRate);
    if (!Number.isInteger(parsedHeartRate) || parsedHeartRate <= 0) {
      errors.heartRate = "心率必須為正整數";
    }
  }

  return !hasAnyError.value;
}

function toPayload(): CreateTrainingPayload {
  const payload: CreateTrainingPayload = {
    performed_at: new Date(form.performedAt).toISOString(),
    action_name: form.actionName.trim(),
    sets: Number(form.sets),
    reps: Number(form.reps),
    weight: Number(form.weight),
    notes: form.notes.trim() || undefined,
  };

  if (form.heartRate.trim()) {
    payload.heart_rate = Number(form.heartRate);
  }

  return payload;
}

async function submitForm() {
  clearMessages();

  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  try {
    await createTraining(toPayload());
    submitSuccess.value = "訓練紀錄已成功建立";
    clearForm();
  } catch {
    submitError.value = "提交失敗，請稍後再試一次";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section
    class="border-2 border-[#222836] shadow-[inset_0_0_0_1px_rgba(143,245,255,0.06)]"
  >
    <div class="mx-auto max-w-[480px] px-4 pb-8 pt-6">
      <form class="flex flex-col gap-3" novalidate @submit.prevent="submitForm">
        <label
          class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
          for="action-name"
          >動作類型</label
        >
        <BaseInput
          id="action-name"
          v-model="form.actionName"
          type="text"
          placeholder="例如：下拉（LAT PULLDOWN）"
          autocomplete="off"
        />
        <p v-if="errors.actionName" class="mt-0.5 text-[13px] text-[#ff8fa0]">
          {{ errors.actionName }}
        </p>

        <label
          class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
          for="weight"
          >負重量（kg）</label
        >
        <BaseInput
          id="weight"
          v-model="form.weight"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0 公斤"
          inputmode="decimal"
        />
        <p v-if="errors.weight" class="mt-0.5 text-[13px] text-[#ff8fa0]">
          {{ errors.weight }}
        </p>

        <div class="grid grid-cols-2 gap-4 max-[640px]:gap-3">
          <div>
            <label
              class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
              for="sets"
              >組數</label
            >
            <BaseInput
              id="sets"
              v-model="form.sets"
              type="number"
              min="1"
              step="1"
              placeholder="例如：3"
              inputmode="numeric"
            />
            <p v-if="errors.sets" class="mt-0.5 text-[13px] text-[#ff8fa0]">
              {{ errors.sets }}
            </p>
          </div>

          <div>
            <label
              class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
              for="reps"
              >次數</label
            >
            <BaseInput
              id="reps"
              v-model="form.reps"
              type="number"
              min="1"
              step="1"
              placeholder="例如：10"
              inputmode="numeric"
            />
            <p v-if="errors.reps" class="mt-0.5 text-[13px] text-[#ff8fa0]">
              {{ errors.reps }}
            </p>
          </div>
        </div>

        <label
          class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
          for="heart-rate"
          >心率（BPM）</label
        >
        <BaseInput
          id="heart-rate"
          v-model="form.heartRate"
          type="number"
          min="1"
          step="1"
          placeholder="例如：120"
          inputmode="numeric"
        />
        <p v-if="errors.heartRate" class="mt-0.5 text-[13px] text-[#ff8fa0]">
          {{ errors.heartRate }}
        </p>

        <label
          class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
          for="performed-at"
          >訓練時間</label
        >
        <BaseInput
          id="performed-at"
          v-model="form.performedAt"
          type="datetime-local"
        />
        <p v-if="errors.performedAt" class="mt-0.5 text-[13px] text-[#ff8fa0]">
          {{ errors.performedAt }}
        </p>

        <label
          class="text-base uppercase tracking-[0.08em] text-[#8ff5ff]"
          for="notes"
          >觀察紀錄（備註）</label
        >
        <BaseInput
          as="textarea"
          id="notes"
          v-model="form.notes"
          placeholder="例如：狀態良好，最後一組略感疲勞"
          :rows="4"
        />

        <p v-if="submitError" class="my-1.5 text-sm text-[#ff8fa0]">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess" class="my-1.5 text-sm text-[#9dfca4]">
          {{ submitSuccess }}
        </p>

        <button
          class="mt-2 h-12 border-0 rounded-md bg-gradient-to-r from-[#73d9df] to-[#8defff] font-bold uppercase tracking-[0.12em] text-[#154c5e] disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:brightness-105"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "寫入中..." : "送出" }}
        </button>

        <button
          class="mt-2 h-12 border border-[#45484f] rounded-md font-bold bg-transparent text-base uppercase tracking-[0.12em] text-[#8ff5ff] disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:border-[#8ff5ff]"
          type="button"
          @click="clearForm"
        >
          清除
        </button>
      </form>
    </div>
  </section>
</template>
