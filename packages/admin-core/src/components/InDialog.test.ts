import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InDialog from "./InDialog.vue";

const dialogStub = {
  template:
    "<div class=\"in-dialog\" :class=\"$attrs.class\" :data-show-close=\"$attrs['show-close']\" :data-align-center=\"$attrs['align-center']\"><slot name=\"header\" /><slot /><slot name=\"footer\" /></div>",
};

describe("InDialog", () => {
  it("使用中性标题且危险语气可区分", () => {
    const wrapper = mount(InDialog, {
      props: {
        modelValue: true,
        title: "删除成员",
        description: "将移除张三的访问权限",
        tone: "danger",
      },
      slots: { footer: "<button>删除</button>" },
      global: {
        stubs: {
          ElDialog: dialogStub,
        },
      },
    });
    expect(wrapper.get(".title").text()).toBe("删除成员");
    expect(wrapper.get(".description").text()).toContain("张三");
    expect(wrapper.classes()).toContain("is-danger");
    expect(wrapper.find(".rect").exists()).toBe(false);
  });

  it("标题左侧可自定义图标，关闭按钮可关掉", () => {
    const wrapper = mount(InDialog, {
      props: {
        modelValue: true,
        title: "你确定要恢复该员工账号吗？",
        showClose: false,
      },
      slots: {
        icon: "<span class=\"custom-icon\">!</span>",
        default: "<p>杨紫微 来自 英格特云</p>",
      },
      global: {
        stubs: {
          ElDialog: dialogStub,
        },
      },
    });
    expect(wrapper.find(".custom-icon").exists()).toBe(true);
    expect(wrapper.find(".in-dialog__icon").exists()).toBe(true);
    expect(wrapper.classes()).toContain("is-no-close");
    expect(wrapper.attributes("data-show-close")).toBe("false");
    expect(wrapper.attributes("data-align-center")).toBe("true");
    expect(wrapper.text()).toContain("杨紫微 来自 英格特云");
  });
});
