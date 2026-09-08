import { createVNode, nextTick, render } from "vue";
import InGlobalLoading from "@/components/InGlobalLoading.vue";

let host: HTMLElement | null = null;

export const useGlobalLoading = () => {
  const start = (hint?: string) => {
    if (window.globalLoading) {
      return;
    }

    host = document.createElement("div");
    document.body.insertBefore(host, document.body.childNodes[0]);
    render(createVNode(InGlobalLoading, { hint: hint ?? "加载中..." }), host);
    window.globalLoading = true;
  };

  const stop = (time: number = 0) => {
    nextTick(() => {
      setTimeout(() => {
        window.globalLoading = false;
        if (!host) {
          return;
        }
        render(null, host);
        host.parentNode?.removeChild(host);
        host = null;
      }, time);
    });
  };

  return {
    start,
    stop,
  };
};

export default useGlobalLoading;
