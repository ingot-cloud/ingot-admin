import { describe, expect, it } from "vitest";
import { DOMWrapper, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import InPicker from "./InPicker.vue";
import type { InPickerOption } from "./types";

const options: Array<InPickerOption> = [
  { value: "", label: "全部" },
  { value: "normal", label: "正常" },
  { value: "paused", label: "已暂停" },
];

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(InPicker, {
    props: {
      options,
      modelValue: "",
      ...props,
    },
    attachTo: document.body,
  });

describe("InPicker", () => {
  it("有 label 时同时显示前缀和当前值", () => {
    const wrapper = mountPicker({ label: "账号状态" });
    expect(wrapper.get(".in-picker__label").text()).toBe("账号状态");
    expect(wrapper.get(".in-picker__value").text()).toBe("全部");
    wrapper.unmount();
  });

  it("未传 label 时只显示当前选项", () => {
    const wrapper = mountPicker({ modelValue: "paused" });
    expect(wrapper.find(".in-picker__label").exists()).toBe(false);
    expect(wrapper.get(".in-picker__value").text()).toBe("已暂停");
    wrapper.unmount();
  });

  it("打开后选中项带勾选，点选会更新值并关闭", async () => {
    const wrapper = mountPicker({ label: "账号状态" });
    await wrapper.get(".in-picker__trigger").trigger("click");
    await nextTick();
    const items = document.querySelectorAll(".in-picker__item");
    expect(items).toHaveLength(3);
    expect(items[0]?.classList.contains("is-selected")).toBe(true);
    expect(items[0]?.querySelector(".in-picker__check")).toBeTruthy();
    (items[1] as HTMLButtonElement).click();
    await nextTick();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["normal"]);
    expect(wrapper.emitted("change")?.[0]).toEqual(["normal"]);
    expect(document.querySelector(".in-picker__menu")).toBeNull();
    wrapper.unmount();
  });

  it("Esc 与点击外部会关闭面板", async () => {
    const wrapper = mountPicker();
    await wrapper.get(".in-picker__trigger").trigger("click");
    await nextTick();
    expect(document.querySelector(".in-picker__menu")).toBeTruthy();
    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();
    expect(document.querySelector(".in-picker__menu")).toBeNull();

    await wrapper.get(".in-picker__trigger").trigger("click");
    await nextTick();
    await new DOMWrapper(document.body.querySelector(".in-picker__menu")!).trigger("keydown", {
      key: "Escape",
    });
    await nextTick();
    expect(document.querySelector(".in-picker__menu")).toBeNull();
    wrapper.unmount();
  });

  it("相邻实例默认使用 12px 间距 token", () => {
    const wrapper = mount({
      components: { InPicker },
      template: `<div><in-picker :options="options" /><in-picker :options="options" /></div>`,
      setup: () => ({ options }),
    });
    expect(wrapper.findAll(".in-picker")).toHaveLength(2);
    wrapper.unmount();
  });
});
