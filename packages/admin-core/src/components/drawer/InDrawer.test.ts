import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InDrawer from "./InDrawer.vue";

describe("InDrawer", () => {
  it("使用中性标题且操作区固定，不再依赖装饰竖条", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "编辑成员" },
      slots: { footer: "<button>保存</button>" },
      global: {
        stubs: {
          ElDrawer: {
            template:
              "<div class=\"in-drawer\"><slot name=\"header\" /><slot /><slot name=\"footer\" /></div>",
          },
        },
      },
    });
    expect(wrapper.get(".title").text()).toBe("编辑成员");
    expect(wrapper.find(".rect").exists()).toBe(false);
    expect(wrapper.get(".in-drawer__footer").text()).toBe("保存");
  });
});
