import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InCursorPager from "./InCursorPager.vue";

describe("InCursorPager", () => {
  it("只显示页序号，按可翻方向启用按钮并发出事件", async () => {
    const wrapper = mount(InCursorPager, {
      props: { page: 2, size: 20, hasPrev: true, hasNext: false },
    });
    expect(wrapper.text()).toContain("第 2 页");
    expect(wrapper.text()).not.toContain("共");
    const prev = wrapper.get("[aria-label='上一页']");
    const next = wrapper.get("[aria-label='下一页']");
    expect(next.attributes("disabled")).toBeDefined();
    expect(prev.attributes("disabled")).toBeUndefined();
    await prev.trigger("click");
    await next.trigger("click");
    expect(wrapper.emitted("prev")).toHaveLength(1);
    expect(wrapper.emitted("next")).toBeUndefined();
  });

  it("禁用时两个方向都不可点", () => {
    const wrapper = mount(InCursorPager, {
      props: { page: 1, size: 20, hasPrev: true, hasNext: true, disabled: true },
    });
    expect(wrapper.get("[aria-label='上一页']").attributes("disabled")).toBeDefined();
    expect(wrapper.get("[aria-label='下一页']").attributes("disabled")).toBeDefined();
  });
});
