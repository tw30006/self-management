<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { createTraining, type CreateTrainingPayload } from "../api/trainings";

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
  <section class="training-page">
    <div class="training-card">
      <div class="panel-label">manual_override // input</div>

      <form class="training-form" novalidate @submit.prevent="submitForm">
        <label class="field-label" for="action-name">exercise_type</label>
        <input
          id="action-name"
          v-model="form.actionName"
          class="field-input"
          type="text"
          placeholder="e.g. LAT PULLDOWN"
          autocomplete="off"
        />
        <p v-if="errors.actionName" class="field-error">
          {{ errors.actionName }}
        </p>

        <label class="field-label" for="weight">load_magnitude (kg)</label>
        <input
          id="weight"
          v-model="form.weight"
          class="field-input"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.00"
          inputmode="decimal"
        />
        <p v-if="errors.weight" class="field-error">{{ errors.weight }}</p>

        <div class="grid-two">
          <div>
            <label class="field-label" for="sets">sets</label>
            <input
              id="sets"
              v-model="form.sets"
              class="field-input"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              inputmode="numeric"
            />
            <p v-if="errors.sets" class="field-error">{{ errors.sets }}</p>
          </div>

          <div>
            <label class="field-label" for="reps">reps</label>
            <input
              id="reps"
              v-model="form.reps"
              class="field-input"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              inputmode="numeric"
            />
            <p v-if="errors.reps" class="field-error">{{ errors.reps }}</p>
          </div>
        </div>

        <label class="field-label" for="heart-rate">biometric_hr</label>
        <input
          id="heart-rate"
          v-model="form.heartRate"
          class="field-input"
          type="number"
          min="1"
          step="1"
          placeholder="BPM"
          inputmode="numeric"
        />
        <p v-if="errors.heartRate" class="field-error">
          {{ errors.heartRate }}
        </p>

        <label class="field-label" for="performed-at">performed_at</label>
        <input
          id="performed-at"
          v-model="form.performedAt"
          class="field-input"
          type="datetime-local"
        />
        <p v-if="errors.performedAt" class="field-error">
          {{ errors.performedAt }}
        </p>

        <label class="field-label" for="notes"
          >session_observables (notes)</label
        >
        <textarea
          id="notes"
          v-model="form.notes"
          class="field-input field-textarea"
          placeholder="LOG SENSORY DATA HERE..."
          rows="4"
        />

        <p v-if="submitError" class="submit-status submit-error">
          {{ submitError }}
        </p>
        <p v-if="submitSuccess" class="submit-status submit-success">
          {{ submitSuccess }}
        </p>

        <button
          class="button button-primary"
          type="submit"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? "WRITING..." : "execute_write" }}
        </button>

        <button
          class="button button-secondary"
          type="button"
          @click="clearForm"
        >
          clear_buffer
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.training-page {
  min-height: calc(100vh - 12rem);
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(13, 94, 146, 0.25),
      transparent 46%
    ),
    linear-gradient(160deg, #0b1019 0%, #10182a 52%, #111827 100%);
  border: 1px solid #222836;
  box-shadow: inset 0 0 0 1px rgba(143, 245, 255, 0.06);
}

.training-card {
  max-width: 480px;
  margin: 0 auto;
  padding: 24px 16px 32px;
  position: relative;
}

.panel-label {
  position: absolute;
  top: -1px;
  right: 16px;
  transform: translateY(-50%);
  border: 1px solid #8ff5ff;
  padding: 7px 14px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 10px;
  color: #8ff5ff;
  background-color: #111827;
}

.training-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  color: #8ff5ff;
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-input {
  width: 100%;
  border: 1px solid #45484f;
  background-color: #1c2028;
  color: #8ff5ff;
  font-size: 16px;
  padding: 12px;
  box-sizing: border-box;
  outline: none;
}

.field-input:focus {
  border-color: #8ff5ff;
  box-shadow: 0 0 0 1px rgba(143, 245, 255, 0.4);
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: #a9abb3;
}

.field-textarea {
  resize: vertical;
  min-height: 108px;
}

.grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field-error {
  margin: 2px 0 0;
  color: #ff8fa0;
  font-size: 13px;
}

.submit-status {
  margin: 6px 0;
  font-size: 14px;
}

.submit-error {
  color: #ff8fa0;
}

.submit-success {
  color: #9dfca4;
}

.button {
  margin-top: 8px;
  height: 48px;
  border: 1px solid #45484f;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 16px;
  color: #8ff5ff;
  background-color: transparent;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: linear-gradient(90deg, #73d9df, #8defff);
  color: #154c5e;
  font-weight: 700;
  border: 0;
}

.button-primary:not(:disabled):hover {
  filter: brightness(1.05);
}

.button-secondary:not(:disabled):hover {
  border-color: #8ff5ff;
}

@media (max-width: 640px) {
  .training-card {
    padding: 24px 16px 32px;
  }

  .grid-two {
    gap: 12px;
  }
}
</style>
