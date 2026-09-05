import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InContainer from "./InContainer.vue";

describe("InContainer", () => {
  it("默认 plain：无边框、直角、背景透明", () => {
    const wrapper = mount(InContainer, {
      slots: { default: "<p>内容</p>" },
      global: { stubs: { ElBacktop: true } },
    });
    const root = wrapper.get(".in-container");
    expect(root.classes()).toContain("is-plain");
    expect(root.classes()).not.toContain("is-bordered");
    expect(root.attributes("style") ?? "").not.toContain("border-radius: 8px");
  });

  it("bordered 变体通过属性打开边框", () => {
    const wrapper = mount(InContainer, {
      props: { variant: "bordered" },
      global: { stubs: { ElBacktop: true } },
    });
    expect(wrapper.get(".in-container").classes()).toContain("is-bordered");
  });

  it("可通过 radius / background / borderColor 覆盖表面", () => {
    const wrapper = mount(InContainer, {
      props: { radius: "12px", background: "#fff", borderColor: "#dee0e3" },
      global: { stubs: { ElBacktop: true } },
    });
    const style = wrapper.get(".in-container").attributes("style") ?? "";
    expect(style).toContain("--in-container-radius: 12px");
    expect(style).toContain("--in-container-bg: #fff");
    expect(style).toContain("--in-container-border-color: #dee0e3");
    expect(style).toContain("--in-container-border-width: 1px");
  });
});
