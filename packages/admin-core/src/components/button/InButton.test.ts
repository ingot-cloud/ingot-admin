import { describe, expect, it, vi } from "vitest";
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
});
