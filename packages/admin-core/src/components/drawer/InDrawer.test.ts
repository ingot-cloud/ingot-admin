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
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    expect(wrapper.get(".title").text()).toBe("编辑成员");
    expect(wrapper.find(".rect").exists()).toBe(false);
    expect(wrapper.get(".in-drawer__footer").text()).toBe("保存");
    wrapper.unmount();
  });

  it("没有 footer 插槽时不渲染操作栏", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "通讯录详情" },
      global: {
        stubs: {
          ElDrawer: {
            template:
              '<div class="in-drawer"><slot name="header" /><slot /><slot name="footer" /></div>',
          },
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    expect(wrapper.find(".in-drawer__footer").exists()).toBe(false);
    wrapper.unmount();
  });

  it("pinned 布局给抽屉加上钉住内容区的 class", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "成员详情", layout: "pinned" },
      global: {
        stubs: {
          ElDrawer: {
            template: "<div class=\"in-drawer\" :class=\"$attrs.class\"><slot /></div>",
          },
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    expect(wrapper.html()).toContain("in-drawer--pinned");
    wrapper.unmount();
  });

  it("默认遮罩 class 为透明，可追加自定义 modal-class", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "编辑", modalClass: "my-mask" },
      global: {
        stubs: {
          ElDrawer: {
            template:
              "<div class=\"in-drawer\" :data-modal-class=\"$attrs.modalClass || $attrs['modal-class']\"><slot /></div>",
          },
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    const modalClass = wrapper.get(".in-drawer").attributes("data-modal-class") ?? "";
    expect(modalClass).toContain("in-drawer-overlay");
    expect(modalClass).toContain("my-mask");
    wrapper.unmount();
  });

  it("close-position=start 时左侧关闭，不再显示右上角关闭", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "编辑权限", closePosition: "start" },
      global: {
        stubs: {
          ElDrawer: {
            template:
              "<div class=\"in-drawer\" :data-show-close=\"$attrs.showClose ?? $attrs['show-close']\"><slot name=\"header\" /></div>",
          },
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    expect(wrapper.get(".in-drawer__close-start").text()).toContain("关闭");
    expect(wrapper.get(".in-drawer__start-title").text()).toBe("编辑权限");
    expect(wrapper.get(".in-drawer").attributes("data-show-close")).toBe("false");
    wrapper.unmount();
  });

  it("可指定 z-index，供对话框上再开抽屉", () => {
    const wrapper = mount(InDrawer, {
      props: { modelValue: true, title: "创建操作", zIndex: 4000 },
      global: {
        stubs: {
          ElDrawer: {
            template:
              "<div class=\"in-drawer\" :data-z-index=\"$attrs.zIndex ?? $attrs['z-index']\"><slot /></div>",
          },
          InLoading: { template: '<div class="in-loading"><slot /></div>' },
        },
      },
    });
    expect(wrapper.get(".in-drawer").attributes("data-z-index")).toBe("4000");
    wrapper.unmount();
  });
});
