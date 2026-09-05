import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InSubmenu from "./InSubmenu.vue";
import { shellLayoutKey } from "@/layouts/main/types";
import { useAppStateStore } from "@/stores/modules/app";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";

const group = {
  path: "/org",
  title: "组织",
  icon: "ep:office-building",
  children: [
    { path: "/org/members", title: "成员" },
    { path: "/org/dept", title: "部门" },
  ],
};

describe("InSubmenu", () => {
  const mountSubmenu = (options?: { collapsed?: boolean; route?: typeof group }) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
    });
    useAppStateStore().menuOpenStatus = options?.collapsed ? false : true;
    return mount(InSubmenu, {
      props: { route: options?.route ?? group },
      global: {
        plugins: [pinia],
        provide: {
          [shellLayoutKey as symbol]: {
            isOverlay: { value: false },
          },
        },
        stubs: {
          ElMenuItem: { template: "<div class='el-menu-item'><slot /><slot name='title' /></div>" },
          ElSubMenu: { template: "<div class='el-sub-menu'><slot name='title' /><slot /></div>" },
          ElIcon: { template: "<i class='el-icon'><slot /></i>" },
          InIcon: true,
        },
      },
    });
  };

  it("收起态隐藏标签且不修改原始路由对象", () => {
    const wrapper = mountSubmenu({ collapsed: true });
    expect(wrapper.text()).not.toContain("组织");
    expect(wrapper.text()).not.toContain("成员");
    expect(group.title).toBe("组织");
    expect(group.children?.[0]?.title).toBe("成员");
    wrapper.unmount();
    resetAdminRuntime();
  });

  it("有图标的分组带 has-icon，子级不渲染空图标占位", () => {
    const wrapper = mountSubmenu();
    expect(wrapper.get(".el-sub-menu").classes()).toContain("in-menu-node");
    expect(wrapper.get(".el-sub-menu").classes()).toContain("has-icon");
    expect(wrapper.get(".el-sub-menu").attributes("style") ?? "").toContain("--in-menu-depth: 0");
    expect(wrapper.findAll(".in-menu-node__icon")).toHaveLength(1);
    const children = wrapper.findAll(".el-menu-item");
    expect(children).toHaveLength(2);
    expect(children[0].classes()).not.toContain("has-icon");
    expect(children[0].attributes("style") ?? "").toContain("--in-menu-depth: 1");
    wrapper.unmount();
    resetAdminRuntime();
  });
});
