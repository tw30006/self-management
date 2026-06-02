import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import TrainingCreateView from "./TrainingCreateView.vue";
import { createTraining } from "../api/trainings";

const pushMock = vi.fn();

vi.mock("vue-router", () => ({
  useRoute: () => ({ name: "training-create", params: {} }),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../api/trainings", () => ({
  createTraining: vi.fn(),
  editTraining: vi.fn(),
  getTraining: vi.fn(),
}));

const createTrainingMock = vi.mocked(createTraining);

async function fillValidForm(wrapper: ReturnType<typeof mount>) {
  await wrapper.find("#action-name").setValue("Bench Press");
  await wrapper.find("#weight").setValue("60");
  await wrapper.find("#sets").setValue("3");
  await wrapper.find("#reps").setValue("10");
  await wrapper.find("#performed-at").setValue("2026-06-02T10:00");
}

describe("TrainingCreateView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("欄位空白時驗證失敗，顯示錯誤且不呼叫 API", async () => {
    const wrapper = mount(TrainingCreateView);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createTrainingMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("動作名稱不能為空");
    expect(wrapper.text()).toContain("組數必須為正整數");
  });

  it("組數為小數時顯示組數錯誤", async () => {
    const wrapper = mount(TrainingCreateView);
    await fillValidForm(wrapper);
    await wrapper.find("#sets").setValue("1.5");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createTrainingMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("組數必須為正整數");
  });

  it("驗證通過時以正確 payload 建立訓練並清空表單", async () => {
    createTrainingMock.mockResolvedValueOnce({} as never);
    const wrapper = mount(TrainingCreateView);
    await fillValidForm(wrapper);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createTrainingMock).toHaveBeenCalledTimes(1);
    const payload = createTrainingMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      action_name: "Bench Press",
      sets: 3,
      reps: 10,
      weight: 60,
    });
    expect(typeof payload.performed_at).toBe("string");

    const actionInput = wrapper.find<HTMLInputElement>("#action-name");
    expect(actionInput.element.value).toBe("");
    expect(wrapper.text()).not.toContain("提交失敗，請稍後再試一次");
  });

  it("API 失敗時顯示提交失敗訊息", async () => {
    createTrainingMock.mockRejectedValueOnce(new Error("network"));
    const wrapper = mount(TrainingCreateView);
    await fillValidForm(wrapper);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createTrainingMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain("提交失敗，請稍後再試一次");
  });
});
