import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InSelectionTag from "./InSelectionTag.vue";

describe("InSelectionTag", () => {
  it("无图片时头像显示名字最后一位", () => {
    const wrapper = mount(InSelectionTag, { props: { name: "欧阳修" } });
    expect(wrapper.get(".in-avatar__fallback").text()).toBe("修");
    expect(wrapper.get(".in-selection-tag__name").text()).toBe("欧阳修");
    expect(wrapper.classes()).toContain("has-avatar");
    wrapper.unmount();
  });

  it("不带头像时不渲染头像并使用小圆角", () => {
    const wrapper = mount(InSelectionTag, { props: { name: "研发部", showAvatar: false } });
    expect(wrapper.find(".in-selection-tag__avatar").exists()).toBe(false);
    expect(wrapper.classes()).not.toContain("has-avatar");
    wrapper.unmount();
  });

  it("background 覆盖默认背景", () => {
    const wrapper = mount(InSelectionTag, { props: { name: "王超", background: "#fff1f0" } });
    expect(wrapper.attributes("style")).toContain("--in-selection-tag-bg: #fff1f0");
    wrapper.unmount();
  });

  it("可删除时点击删除只触发 close", async () => {
    const wrapper = mount(InSelectionTag, { props: { name: "王超", closable: true } });
    await wrapper.get(".in-close-button").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.get(".in-close-button").attributes("aria-label")).toBe("移除 王超");
    wrapper.unmount();
  });

  it("disabled 时不显示删除", () => {
    const wrapper = mount(InSelectionTag, {
      props: { name: "王超", closable: true, disabled: true },
    });
    expect(wrapper.find(".in-close-button").exists()).toBe(false);
    wrapper.unmount();
  });

  it("支持 avatar、名字与 suffix 插槽", () => {
    const wrapper = mount(InSelectionTag, {
      props: { name: "研发部" },
      slots: {
        avatar: '<i class="custom-avatar" />',
        default: "<b>研发部（含下级）</b>",
        suffix: '<input type="checkbox" class="custom-suffix" />',
      },
    });
    expect(wrapper.find(".custom-avatar").exists()).toBe(true);
    expect(wrapper.find(".in-avatar").exists()).toBe(false);
    expect(wrapper.get(".in-selection-tag__name").text()).toBe("研发部（含下级）");
    expect(wrapper.find(".in-selection-tag__suffix .custom-suffix").exists()).toBe(true);
    wrapper.unmount();
  });
});
