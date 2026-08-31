import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 验证 target 与 base/core 共享同一 Pinia 实例的演示 store。
 */
export const useTargetSharedStore = defineStore("target.shared", () => {
  const counter = ref(0);
  const note = ref("来自 target.shared");

  const increment = () => {
    counter.value += 1;
  };

  const reset = () => {
    counter.value = 0;
    note.value = "来自 target.shared";
  };

  return {
    counter,
    note,
    increment,
    reset,
  };
});
