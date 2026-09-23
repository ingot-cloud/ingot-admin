import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InLoadingMark from "./InLoadingMark.vue";

describe("InLoadingMark", () => {
  it("默认带圆角底，把转圈和后面的页面分开", () => {
    const wrapper = mount(InLoadingMark);
    expect(wrapper.find(".in-loading-mark").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark-card").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark-overlay").exists()).toBe(false);
    wrapper.unmount();
  });

  it("framed 关掉后只留转圈", () => {
    const wrapper = mount(InLoadingMark, { props: { framed: false } });
    expect(wrapper.find(".in-loading-mark").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark-card").exists()).toBe(false);
    wrapper.unmount();
  });

  it("区域遮罩罩住当前容器并保留圆角底", () => {
    const wrapper = mount(InLoadingMark, { props: { overlay: "local" } });
    expect(wrapper.find(".in-loading-mark-overlay.is-local").exists()).toBe(true);
    expect(wrapper.find(".in-loading-mark-card").exists()).toBe(true);
    wrapper.unmount();
  });

  it("全屏遮罩提到 body，并可用 framed 关掉圆角底", () => {
    const wrapper = mount(InLoadingMark, {
      props: { overlay: "fullscreen", framed: false },
      attachTo: document.body,
    });
    const overlay = document.body.querySelector(".in-loading-mark-overlay.is-fullscreen");
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector(".in-loading-mark-card")).toBeNull();
    wrapper.unmount();
  });
});
