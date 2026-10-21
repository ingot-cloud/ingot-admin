import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InSelectionField from "./InSelectionField.vue";
import { selectionOverflowCount, visibleSelection } from "./selectionOverflow";

const items = [
  { id: "1", name: "王超" },
  { id: "2", name: "欧阳修" },
  { id: "3", name: "李白" },
];

const stubs = { InIcon: { props: ["name"], template: '<i class="in-icon-stub">{{ name }}</i>' } };

describe("selectionOverflow", () => {
  it("未给上限时全部可见", () => {
    expect(visibleSelection(items)).toHaveLength(3);
    expect(visibleSelection(items, 2)).toHaveLength(2);
  });

  it("+N 基于总数与可见数量", () => {
    expect(selectionOverflowCount(10, 5)).toBe(5);
    expect(selectionOverflowCount(3, 5)).toBe(0);
  });
});

describe("InSelectionField", () => {
  it("无选中时显示占位与默认编辑图标", () => {
    const wrapper = mount(InSelectionField, {
      props: { placeholder: "请选择成员" },
      global: { stubs },
    });
    expect(wrapper.get(".in-selection-field__placeholder").text()).toBe("请选择成员");
    expect(wrapper.get(".in-icon-stub").text()).toBe("ep:edit");
    wrapper.unmount();
  });

  it("icon=false 时不显示图标", () => {
    const wrapper = mount(InSelectionField, { props: { icon: false }, global: { stubs } });
    expect(wrapper.find(".in-selection-field__icon").exists()).toBe(false);
    wrapper.unmount();
  });

  it("按 maxVisible 与 total 显示 +N", () => {
    const wrapper = mount(InSelectionField, {
      props: { items, maxVisible: 2, total: 8 },
      global: { stubs },
    });
    expect(wrapper.findAll(".in-selection-tag")).toHaveLength(2);
    expect(wrapper.get(".in-selection-field__more").text()).toBe("+6");
    wrapper.unmount();
  });

  it("点击与 Enter/Space 触发 click", async () => {
    const wrapper = mount(InSelectionField, { props: { items }, global: { stubs } });
    await wrapper.trigger("click");
    await wrapper.trigger("keydown", { key: "Enter" });
    await wrapper.trigger("keydown", { key: " " });
    expect(wrapper.emitted("click")).toHaveLength(3);
    wrapper.unmount();
  });

  it("删除标签只触发 remove，不打开选择器", async () => {
    const wrapper = mount(InSelectionField, {
      props: { items, closable: true },
      global: { stubs },
    });
    await wrapper.findAll(".in-close-button")[1]!.trigger("click");
    expect(wrapper.emitted("remove")?.[0]).toEqual([items[1]]);
    expect(wrapper.emitted("click")).toBeUndefined();
    wrapper.unmount();
  });

  it("tag-suffix 区点击不打开选择器", async () => {
    const wrapper = mount(InSelectionField, {
      props: { items },
      slots: { "tag-suffix": '<span class="suffix-hit">含下级</span>' },
      global: { stubs },
    });
    await wrapper.findAll(".suffix-hit")[0]!.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
    wrapper.unmount();
  });

  it("disabled 时不触发且不显示删除", async () => {
    const wrapper = mount(InSelectionField, {
      props: { items, closable: true, disabled: true },
      global: { stubs },
    });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
    expect(wrapper.find(".in-close-button").exists()).toBe(false);
    expect(wrapper.attributes("tabindex")).toBe("-1");
    wrapper.unmount();
  });

  it("showAvatar=false 时标签不带头像", () => {
    const wrapper = mount(InSelectionField, {
      props: { items, showAvatar: false },
      global: { stubs },
    });
    expect(wrapper.find(".in-avatar").exists()).toBe(false);
    wrapper.unmount();
  });

  it("tagBackground 透传到标签", () => {
    const wrapper = mount(InSelectionField, {
      props: { items: items.slice(0, 1), tagBackground: "#f0f0f0" },
      global: { stubs },
    });
    expect(wrapper.get(".in-selection-tag").attributes("style")).toContain(
      "--in-selection-tag-bg: #f0f0f0",
    );
    wrapper.unmount();
  });
});
