import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InCommonStatusTag from "./InCommonStatusTag.vue";
import { CommonStatus } from "@/models/enums";

describe("InCommonStatusTag", () => {
  it("正常状态使用 info 标签和成功图标", () => {
    const wrapper = mount(InCommonStatusTag, {
      props: { status: CommonStatus.Enable },
    });
    expect(wrapper.get(".in-status-tag").classes()).toContain("is-info");
    expect(wrapper.get(".in-status-tag__content").text()).toBe("正常");
    expect(wrapper.get(".in-status-tag__icon svg").exists()).toBe(true);
    wrapper.unmount();
  });

  it("锁定状态使用 warning 标签并显示已锁定", () => {
    const wrapper = mount(InCommonStatusTag, {
      props: { status: CommonStatus.Lock },
    });
    expect(wrapper.get(".in-status-tag").classes()).toContain("is-warning");
    expect(wrapper.get(".in-status-tag__content").text()).toBe("已锁定");
    wrapper.unmount();
  });

  it("数字状态码与字符串等价", () => {
    const wrapper = mount(InCommonStatusTag, {
      props: { status: 0 },
    });
    expect(wrapper.get(".in-status-tag__content").text()).toBe("正常");
    wrapper.unmount();
  });

  it("无状态时不渲染", () => {
    const wrapper = mount(InCommonStatusTag);
    expect(wrapper.find(".in-status-tag").exists()).toBe(false);
    wrapper.unmount();
  });
});
