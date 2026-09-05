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
  it("收起态隐藏标签且不修改原始路由对象", () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
    });
    useAppStateStore().menuOpenStatus = false;
    const wrapper = mount(InSubmenu, {
      props: { route: group },
      global: {
        plugins: [pinia],
        provide: {
          [shellLayoutKey as symbol]: {
            isOverlay: { value: false },
          },
        },
        stubs: {
          ElMenuItem: { template: "<div class='item'><slot /><slot name='title' /></div>" },
          ElSubMenu: { template: "<div class='group'><slot name='title' /><slot /></div>" },
          ElIcon: { template: "<i><slot /></i>" },
          InIcon: true,
        },
      },
    });
    expect(wrapper.text()).not.toContain("组织");
    expect(wrapper.text()).not.toContain("成员");
    expect(group.title).toBe("组织");
    expect(group.children?.[0]?.title).toBe("成员");
    wrapper.unmount();
    resetAdminRuntime();
  });
});
