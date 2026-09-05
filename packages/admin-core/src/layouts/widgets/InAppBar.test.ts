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
        InLogo: { template: '<div class="logo-stub">管理后台</div>' },
        InAppBarSearch: {
          template: '<input class="search-stub" placeholder="搜索功能" />',
        },
        InFullscreen: { template: '<button aria-label="全屏" />' },
        InGlobalSetting: { template: '<button aria-label="设置" />' },
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

  it("顶栏按品牌 / 导航 / 搜索 / 操作四区排列，搜索靠右", () => {
    const wrapper = mountBar({ nav: "<button class='nav-item'>产品</button>" });
    const children = [...wrapper.get(".in-app-bar").element.children].map(
      (item) => (item as HTMLElement).className,
    );
    expect(children[0]).toContain("in-app-bar__brand");
    expect(children[1]).toContain("in-app-bar__nav");
    expect(children[2]).toContain("in-app-bar__search-pane");
    expect(children[3]).toContain("in-app-bar__actions");
    expect(wrapper.get("[data-testid='app-bar-search'] .search-stub").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-nav'] .nav-item").text()).toBe("产品");
    expect(wrapper.get("[data-testid='app-bar-brand'] .logo-stub").exists()).toBe(true);
    expect(wrapper.get("[data-testid='app-bar-actions'] .user-stub").exists()).toBe(true);
    wrapper.unmount();
  });
});
