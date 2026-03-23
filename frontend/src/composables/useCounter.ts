import { ref } from "vue";

export const useCounter = () => {
  const localCount = ref(0);

  const increaseLocal = () => {
    localCount.value += 1;
  };

  return {
    localCount,
    increaseLocal,
  };
};
