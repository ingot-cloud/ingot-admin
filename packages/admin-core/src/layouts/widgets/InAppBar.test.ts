import { afterEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InAppBar from "./InAppBar.vue";
import { shellLayoutKey } from "@/layouts/main/types";
import { useAppStateStore } from "@/stores/modules/app";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";
import type { ShellLayoutApi } from "@/layouts/main/types";

const createShell = (): ShellLayoutApi => {
  const isOverlay = computed(() => false);
  const overlayOpen = ref(false);
  return {
    navigationMode: computed(() => "expanded"),
    isOverlay,
    overlayOpen,
    sidebarExpanded: computed(() => true),
    toggleSidebar: () => undefined,
    closeOverlay: () => undefined,
  };
};

const mountBar = (slots?: Record<string, string>) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  configureAdminRuntime({
    appCode: "test-admin",
    branding: { title: "管理后台" },
    login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
    plugins: [],
  });
  useAppStateStore().showSearch = true;
  return mount(InAppBar, {
    slots,
    global: {
      plugins: [pinia],
      provide: { [shellLayoutKey as symbol]: createShell() },
      stubs: {
        InAppBarBrand: {
          template:
            '<div data-testid="app-bar-brand"><div class="logo-stub">管理后台</div><slot name="brand-extra" /></div>',
        },
        InAppBarNav: {
          template:
            '<div data-testid="app-bar-nav"><slot name="header-start" /><slot name="nav" /></div>',
        },
        InAppBarSearchPane: {
          template: '<div data-testid="app-bar-search"><input class="search-stub" placeholder="搜索功能" /></div>',
        },
        InAppBarUtilities: {
          template:
            '<div data-testid="app-bar-utilities"><button aria-label="全屏" /><button aria-label="设置" /><slot name="header-end" /></div>',
        },
        InUserDropdown: { template: '<div class="user-stub" />' },
        InIcon: true,
        ElTooltip: { template: "<span><slot /></span>" },
      },
    },
  });
};

describe("InAppBar", () => {
  afterEach(() => {
    resetAdminRuntime();
  });

  it("顶栏按品牌 / 导航 / 搜索 / 小部件 / 用户五区排列", () => {
    const wrapper = mountBar({ nav: "<button class='nav-item'>产品</button>" });
    expect(wrapper.get("[data-testid='app-bar-brand'] .logo-stub").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-nav'] .nav-item").text()).toBe("产品");
    expect(wrapper.get("[data-testid='app-bar-search'] .search-stub").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-utilities']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-user-divider']").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-user'] .user-stub").exists()).toBe(true);
    wrapper.unmount();
  });
});
