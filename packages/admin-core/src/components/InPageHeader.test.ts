import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import InPageHeader from "./InPageHeader.vue";

describe("InPageHeader", () => {
  it("渲染标题、说明和操作插槽", () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "成员管理", description: "管理组织成员" },
      slots: {
        action: "<button>新建</button>",
      },
      global: { stubs: { InIcon: true } },
    });
    expect(wrapper.get(".in-page-header__title").text()).toBe("成员管理");
    expect(wrapper.get(".in-page-header__description").text()).toBe("管理组织成员");
    expect(wrapper.get(".in-page-header__actions").text()).toBe("新建");
  });

  it("subtitle 作为 description 的兼容别名", () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "概览", subtitle: "插件示例" },
      global: { stubs: { InIcon: true } },
    });
    expect(wrapper.get(".in-page-header__description").text()).toBe("插件示例");
  });

  it("返回按钮发出 back 事件", async () => {
    const wrapper = mount(InPageHeader, {
      props: { title: "详情", showBack: true },
      global: { stubs: { InIcon: true } },
    });
    await wrapper.get(".in-page-header__back").trigger("click");
    expect(wrapper.emitted("back")).toHaveLength(1);
  });
});
