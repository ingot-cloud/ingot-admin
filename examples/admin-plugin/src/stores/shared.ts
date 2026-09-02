import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 验证示例插件与宿主共享同一 Pinia 实例。
 */
export const useExampleSharedStore = defineStore("example.shared", () => {
  const counter = ref(0);
  const note = ref("来自 example.shared");

  const increment = () => {
    counter.value += 1;
  };

  const reset = () => {
    counter.value = 0;
    note.value = "来自 example.shared";
  };

  return {
    counter,
    note,
    increment,
    reset,
  };
});
