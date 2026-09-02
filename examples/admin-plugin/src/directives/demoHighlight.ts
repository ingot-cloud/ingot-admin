import type { Directive } from "vue";

/**
 * 演示指令：挂载时为元素添加高亮样式类。
 */
export const demoHighlightDirective: Directive<HTMLElement, string | undefined> = {
  mounted(el, binding) {
    el.classList.add("example-demo-highlight");
    if (binding.value) {
      el.dataset.demoLabel = binding.value;
    }
  },
  unmounted(el) {
    el.classList.remove("example-demo-highlight");
    delete el.dataset.demoLabel;
  },
};
