import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, onMounted, onUnmounted, type Component } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InAppBar from "./InAppBar.vue";
import { shellLayoutKey } from "@/layouts/main/types";
import { useAppStateStore } from "@/stores/modules/app";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";
import type { ShellLayoutApi } from "@/layouts/main/types";
import { useUserInfoStore } from "@/stores/modules/auth";
import { InAdminHeaderBuiltinUserMenuName } from "@/plugin/header";
import InAppBarBrand from "./header/InAppBarBrand.vue";
import InUserDropdown from "./user-dropdown/InUserDropdown.vue";
import InAppBarSearchPane from "./header/InAppBarSearchPane.vue";

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

const mountBar = (
  slots?: Record<string, string | Component>,
  props: InstanceType<typeof InAppBar>["$props"] = {},
  restricted = false,
  provideShell = true,
) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  configureAdminRuntime({
    appCode: "test-admin",
    branding: { title: "管理后台" },
    login: { fingerprintEnabled: false },
    plugins: [],
  });
  useAppStateStore().showSearch = true;
  useUserInfoStore().userInfo.mustChangePwd = restricted;
  return mount(InAppBar, {
    slots,
    props,
    global: {
      plugins: [pinia],
      provide: provideShell ? { [shellLayoutKey as symbol]: createShell() } : {},
      stubs: {
        InAppBarBrand: {
          props: ["brandComponent", "navigationMode"],
          template:
            '<div data-testid="app-bar-brand"><div class="logo-stub">管理后台</div><slot name="brand-extra" /></div>',
        },
        InAppBarNav: {
          template:
            '<div data-testid="app-bar-nav"><slot name="header-start" /><slot name="nav" /></div>',
        },
        InAppBarSearchPane: {
          props: ["enabled", "searchComponent"],
          template:
            '<div data-testid="app-bar-search"><input class="search-stub" placeholder="搜索功能" /></div>',
        },
        InAppBarUtilities: {
          template:
            '<div data-testid="app-bar-utilities"><button aria-label="全屏" /><button aria-label="设置" /><slot name="header-end" /></div>',
        },
        InUserDropdown: {
          props: ["menu", "trigger", "passwordChangeRequired"],
          template: '<div class="user-stub" />',
        },
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

  it("账号受限时不挂载业务区和旧插槽，自定义配置及 false 不能解除限制", () => {
    const mounted = vi.fn();
    const readUtilities = vi.fn(() => []);
    const extension = defineComponent({
      setup() {
        onMounted(mounted);
        return () => h("button", { class: "extension" }, "业务操作");
      },
    });
    const wrapper = mountBar(
      Object.fromEntries(
        [
          "brand-extra",
          "header-start",
          "nav",
          "org-mgmt",
          "product-settings",
          "header-end",
          "utilities",
        ].map((key) => [key, extension]),
      ),
      {
        passwordChangeRequired: false,
        header: {
          brand: { component: extension },
          navigation: { items: [{ key: "business", label: "业务入口" }] },
          search: { component: extension },
          utilities: readUtilities,
          user: { component: extension, menu: [] },
        },
        utilities: [{ key: "legacy", label: "旧操作", onClick: vi.fn() }],
      },
      true,
    );
    expect(wrapper.find("[data-testid='app-bar-brand']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='app-bar-nav']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='app-bar-search']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='app-bar-utilities']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='app-bar-user-divider']").exists()).toBe(false);
    expect(wrapper.findComponent(InAppBarBrand).props("brandComponent")).toBeUndefined();
    expect(wrapper.findComponent(InAppBarBrand).props("navigationMode")).toBe("expanded");
    expect(wrapper.findComponent(InUserDropdown).props("trigger")).toBeUndefined();
    expect(
      wrapper
        .findComponent(InUserDropdown)
        .props("menu")
        .map((item: { name: string }) => item.name),
    ).toEqual([InAdminHeaderBuiltinUserMenuName.Logout]);
    expect(mounted).not.toHaveBeenCalled();
    expect(readUtilities).not.toHaveBeenCalled();
    expect(useAppStateStore().showSearch).toBe(true);
    wrapper.unmount();
  });

  it("进入受限状态卸载已有业务扩展，解除后恢复配置与搜索偏好", async () => {
    const unmounted = vi.fn();
    const extension = defineComponent({
      setup() {
        onUnmounted(unmounted);
        return () => h("div", { class: "extension" });
      },
    });
    const wrapper = mountBar({ nav: extension });
    expect(wrapper.find(".extension").exists()).toBe(true);
    useUserInfoStore().userInfo.mustChangePwd = true;
    await nextTick();
    expect(wrapper.find(".extension").exists()).toBe(false);
    expect(unmounted).toHaveBeenCalledOnce();
    expect(wrapper.find("[data-testid='app-bar-search']").exists()).toBe(false);
    expect(useAppStateStore().showSearch).toBe(true);
    useUserInfoStore().clear();
    await nextTick();
    expect(wrapper.find(".extension").exists()).toBe(true);
    expect(wrapper.findComponent(InAppBarSearchPane).props("enabled")).toBe(true);
    useAppStateStore().showSearch = false;
    useUserInfoStore().userInfo.mustChangePwd = true;
    await nextTick();
    useUserInfoStore().clear();
    await nextTick();
    expect(wrapper.findComponent(InAppBarSearchPane).props("enabled")).toBe(false);
    wrapper.unmount();
  });

  it("改密页面显式保持受限模式，会话清理后也不恢复普通顶栏", async () => {
    const wrapper = mountBar(undefined, { passwordChangeRequired: true }, true);
    useUserInfoStore().clear();
    await nextTick();
    expect(wrapper.find("[data-testid='app-bar-nav']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='app-bar-search']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='app-bar-utilities']").exists()).toBe(false);
    expect(wrapper.findComponent(InUserDropdown).props("passwordChangeRequired")).toBe(true);
    wrapper.unmount();
  });

  it("独立改密页面不提供主布局时使用默认状态，且不报布局注入警告", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const wrapper = mountBar(undefined, { passwordChangeRequired: true }, true, false);
    try {
      expect(
        warning.mock.calls.some((args) =>
          args.some((value) => String(value).includes("inShellLayout")),
        ),
      ).toBe(false);
      expect(wrapper.findComponent(InAppBarBrand).props("navigationMode")).toBe("expanded");
      expect(
        wrapper
          .findComponent(InUserDropdown)
          .props("menu")
          .map((item: { name: string }) => item.name),
      ).toEqual([InAdminHeaderBuiltinUserMenuName.Logout]);
      expect(wrapper.find("[data-testid='app-bar-nav']").exists()).toBe(false);
    } finally {
      wrapper.unmount();
      warning.mockRestore();
    }
  });
});
