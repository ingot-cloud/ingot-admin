// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { adminAppOptionsKey } from "@/config";
import { useAppStateStore } from "@/stores/modules/app";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";
import InAdminThemeLayout from "./InAdminThemeLayout.vue";
import { adminResolvedThemeKey } from "./useAdminTheme";
import { resolveAdminTheme } from "./resolveTheme";
import { defineAdminTheme } from "./defineAdminTheme";
import { INGOT_ADMIN_THEME_API_VERSION } from "./types";
import { applyAdminTheme, resetAdminThemeDom } from "./applyTheme";
import DefaultAdminShell from "./DefaultAdminShell.vue";

const HeaderStart = defineComponent({
  name: "HeaderStartStub",
  setup: () => () => h("div", { "data-testid": "header-start" }, "start"),
});
const HeaderEnd = defineComponent({
  name: "HeaderEndStub",
  setup: () => () => h("div", { "data-testid": "header-end" }, "end"),
});
const SidebarTop = defineComponent({
  name: "SidebarTopStub",
  setup: () => () => h("div", { "data-testid": "sidebar-top" }, "top"),
});
const CustomHeader = defineComponent({
  name: "CustomHeader",
  setup: () => () => h("div", { "data-testid": "custom-header" }, "custom-header"),
});

const Page = defineComponent({
  name: "DemoPage",
  setup: () => () => h("div", { "data-testid": "page" }, "page"),
});

const IndependentLayout = defineComponent({
  name: "IndependentLayout",
  setup: () => () => h("div", { "data-testid": "independent-layout" }, [h("router-view")]),
});

describe("InAdminThemeLayout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
      settings: { showBreadcrumb: true, showCopyright: true },
    });
    useAppStateStore().showBreadcrumb = true;
    useAppStateStore().showCopyright = true;
    useAppStateStore().menuOpenStatus = true;
  });

  afterEach(() => {
    resetAdminRuntime();
    resetAdminThemeDom();
  });

  const mountLayout = async (theme = resolveAdminTheme()) => {
    applyAdminTheme(theme);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
          component: InAdminThemeLayout,
          children: [{ path: "", component: Page }],
        },
        {
          path: "/custom",
          component: IndependentLayout,
          children: [{ path: "", component: Page }],
        },
      ],
    });
    await router.push("/");
    await router.isReady();
    return mount(InAdminThemeLayout, {
      global: {
        plugins: [router],
        provide: {
          [adminResolvedThemeKey as symbol]: theme,
          [adminAppOptionsKey as symbol]: {
            appCode: "test-admin",
            plugins: [],
            branding: { title: "Test" },
            login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
            shellSlots: {
              "header-start": HeaderStart,
              "header-end": HeaderEnd,
              "sidebar-top": SidebarTop,
            },
          },
        },
        stubs: {
          InAppBar: {
            template:
              '<div class="bar"><slot name="header-start" /><slot name="header-end" /></div>',
          },
          InMenu: {
            template:
              '<nav class="menu"><slot name="sidebar-top" /><slot name="sidebar-bottom" /></nav>',
          },
          InBreadcrumb: { template: '<div data-testid="breadcrumb" />' },
          InCopyright: { template: '<div data-testid="footer" />' },
          ElContainer: { template: "<div><slot /></div>" },
          ElHeader: { template: "<header><slot /></header>" },
          ElAside: { template: "<aside><slot /></aside>" },
          ElMain: { template: "<main><slot /></main>" },
        },
      },
    });
  };

  it("默认宿主转交 shellSlots，并按设置渲染区域", async () => {
    const wrapper = await mountLayout();
    expect(wrapper.find('[data-testid="header-start"]').text()).toBe("start");
    expect(wrapper.find('[data-testid="header-end"]').text()).toBe("end");
    expect(wrapper.find('[data-testid="sidebar-top"]').text()).toBe("top");
    expect(wrapper.find('[data-testid="footer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="tabs"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it("parts 替换只影响对应展示部件", async () => {
    const theme = resolveAdminTheme(
      defineAdminTheme({
        id: "acme-parts",
        apiVersion: INGOT_ADMIN_THEME_API_VERSION,
        name: "部件替换",
        parts: { header: CustomHeader },
      }),
    );
    const wrapper = await mountLayout(theme);
    expect(wrapper.find('[data-testid="custom-header"]').exists()).toBe(true);
    expect(wrapper.find(".bar").exists()).toBe(false);
    expect(wrapper.find(".menu").exists()).toBe(true);
    wrapper.unmount();
  });

  it("独立 layout 不渲染默认主题外壳", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: IndependentLayout, children: [{ path: "", component: Page }] },
      ],
    });
    await router.push("/");
    await router.isReady();
    const wrapper = mount(IndependentLayout, {
      global: { plugins: [router] },
    });
    expect(wrapper.find('[data-testid="independent-layout"]').exists()).toBe(true);
    expect(wrapper.findComponent(DefaultAdminShell).exists()).toBe(false);
    wrapper.unmount();
  });
});
