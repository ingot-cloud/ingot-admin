import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InDialog from "./InDialog.vue";

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
          ElDialog: {
            template:
              "<div class=\"in-dialog\" :class=\"$attrs.class\"><slot name=\"header\" /><slot /><slot name=\"footer\" /></div>",
          },
        },
      },
    });
    expect(wrapper.get(".title").text()).toBe("删除成员");
    expect(wrapper.get(".description").text()).toContain("张三");
    expect(wrapper.classes()).toContain("is-danger");
    expect(wrapper.find(".rect").exists()).toBe(false);
  });
});
