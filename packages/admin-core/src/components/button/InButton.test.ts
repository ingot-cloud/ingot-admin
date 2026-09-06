import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";
import InButton from "./InButton.vue";

describe("InButton", () => {
  it("in-click 为节流后的公开事件", async () => {
    vi.useFakeTimers();
    const wrapper = mount(InButton, {
      slots: { default: "保存" },
      global: {
        stubs: {
          ElButton: {
            template: "<button @click=\"$emit('click', $event)\"><slot /></button>",
          },
        },
      },
    });
    await wrapper.get("button").trigger("click");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("in-click")).toHaveLength(1);
    vi.advanceTimersByTime(1300);
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("in-click")).toHaveLength(2);
    vi.useRealTimers();
  });

  it("把 Ref loading 解成 boolean 再传给按钮", () => {
    const loading = ref(true);
    const wrapper = mount(InButton, {
      props: { loading },
      global: {
        stubs: {
          ElButton: {
            props: { loading: { type: Boolean, default: false } },
            template: '<button :data-loading="String(loading)"><slot /></button>',
          },
        },
      },
    });
    expect(wrapper.get("button").attributes("data-loading")).toBe("true");
  });
});
