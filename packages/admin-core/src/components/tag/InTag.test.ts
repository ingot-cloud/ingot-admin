import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { ElTagType } from "@/models/common";
import InTag from "./InTag.vue";
import InTagEnum from "./InTagEnum.vue";
import StatusTag from "../status/StatusTag.vue";

describe("通用标签", () => {
  const types: ElTagType[] = ["primary", "success", "info", "warning", "danger"];

  it.each(types)("%s 保持通用类型与文字，无强制状态图标", (tag) => {
    const wrapper = mount(InTag, { props: { value: { text: "已接入", tag } } });
    expect(wrapper.get(".el-tag").classes()).toContain(`el-tag--${tag}`);
    expect(wrapper.get(".in-tag__content").text()).toBe("已接入");
    expect(wrapper.find(".in-tag__icon").exists()).toBe(false);
    wrapper.unmount();
  });

  it("保留尺寸、效果、圆角、描边、自定义背景与禁用过渡的透传", () => {
    const wrapper = mount(InTag, {
      props: { value: { text: "自定义", tag: "warning" } },
      attrs: {
        size: "large",
        effect: "plain",
        round: true,
        hit: true,
        color: "#123456",
        disableTransitions: true,
        "data-field": "phone",
      },
    });
    expect(wrapper.get(".el-tag").classes()).toEqual(
      expect.arrayContaining(["el-tag--large", "el-tag--plain", "is-round", "is-hit"]),
    );
    expect(wrapper.element.style.backgroundColor).toBe("rgb(18, 52, 86)");
    expect(wrapper.attributes("data-field")).toBe("phone");
    wrapper.unmount();
  });

  it("关闭按钮仅发出 close，点击标签发出 click", async () => {
    const wrapper = mount(InTag, {
      props: { value: { text: "已选部门", tag: "info" } },
      attrs: { closable: true },
    });
    await wrapper.get(".el-tag__close").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.emitted("click")).toBeUndefined();
    await wrapper.get(".el-tag").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
    wrapper.unmount();
  });

  it("允许替换文字及按需显示图标", () => {
    const wrapper = mount(InTag, {
      props: { value: { text: "原文字", tag: "primary" } },
      slots: { default: "自定义文字", icon: '<svg data-icon="custom"></svg>' },
    });
    expect(wrapper.get(".in-tag__content").text()).toBe("自定义文字");
    expect(wrapper.get(".in-tag__icon").attributes("aria-hidden")).toBe("true");
    expect(wrapper.find('[data-icon="custom"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it("枚举标签动态映射并透传关闭交互", async () => {
    const enumObj = {
      getTagText: (value: string) => ({ text: value, tag: "success" as const }),
    };
    const wrapper = mount(InTagEnum, {
      props: { value: "已接入", enumObj },
      attrs: { closable: true, size: "small" },
    });
    expect(wrapper.get(".el-tag").classes()).toContain("el-tag--small");
    expect(wrapper.get(".in-tag__content").text()).toBe("已接入");
    await wrapper.setProps({ value: "未接入" });
    expect(wrapper.get(".in-tag__content").text()).toBe("未接入");
    await wrapper.get(".el-tag__close").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
    wrapper.unmount();
  });

  it("状态 info 保持蓝色 primary 成功图标，普通 info 保持独立", () => {
    const status = mount(StatusTag, { props: { tone: "info", label: "正常" } });
    expect(status.classes()).toEqual(
      expect.arrayContaining(["in-tag", "in-status-tag", "is-info"]),
    );
    expect(status.get(".el-tag").classes()).toContain("el-tag--primary");
    expect(status.get(".in-status-tag__content").text()).toBe("正常");
    expect(status.get(".in-status-tag__icon svg").exists()).toBe(true);
    status.unmount();
  });
});
