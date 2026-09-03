/**
 * 验证 App 与 admin-core 共享同一 Pinia 实例的演示 store。
 * 需要落盘时自行加 persist，不会默认 persist。
 */
export const useAppSharedStore = defineStore("{{pageKeyPrefix}}.shared", () => {
  const counter = ref(0);
  const note = ref("来自 App 本地 store");

  const increment = () => {
    counter.value += 1;
  };

  const reset = () => {
    counter.value = 0;
    note.value = "来自 App 本地 store";
  };

  return {
    counter,
    note,
    increment,
    reset,
  };
});
