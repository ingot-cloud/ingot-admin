import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InCloseButton from "./InCloseButton.vue";

describe("InCloseButton", () => {
  it("默认可点关闭，小号用于 chip", async () => {
    const wrapper = mount(InCloseButton, {
      props: { label: "移除 张三", size: "sm" },
    });
    expect(wrapper.attributes("aria-label")).toBe("移除 张三");
    expect(wrapper.classes()).toContain("is-sm");
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });
});
