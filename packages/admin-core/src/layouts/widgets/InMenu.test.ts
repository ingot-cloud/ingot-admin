import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import InMenu from "./InMenu.vue";
import InMenuToggle from "./InMenuToggle.vue";
import { shellLayoutKey } from "@/layouts/main/types";
import { useAppStateStore } from "@/stores/modules/app";
import { useRouterStore } from "@/stores/modules/router";
import { configureAdminRuntime, resetAdminRuntime } from "@/runtime";
import { sidebarNavigationFixture } from "./__fixtures__/sidebar-menu";
import type { ShellLayoutApi } from "@/layouts/main/types";

const Page = defineComponent({ render: () => h("div", "page") });

const mockMatchMedia = (width: number) => {
  window.matchMedia = ((query: string) => {
    const match = query.match(/max-width:\s*(\d+)px/);
    const max = match ? Number(match[1]) : Number.POSITIVE_INFINITY;
    return {
      matches: width <= max,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
};

const createShell = (overrides: Partial<{ isOverlay: boolean; overlayOpen: boolean }> = {}): ShellLayoutApi => {
  const isOverlay = computed(() => overrides.isOverlay ?? false);
  const overlayOpen = ref(overrides.overlayOpen ?? false);
  return {
    navigationMode: computed(() => (isOverlay.value ? "overlay" : "expanded")),
    isOverlay,
    overlayOpen,
    sidebarExpanded: computed(() => (isOverlay.value ? overlayOpen.value : true)),
    toggleSidebar: () => {
      overlayOpen.value = !overlayOpen.value;
    },
    closeOverlay: () => {
      overlayOpen.value = false;
    },
  };
};

const mountMenu = async (options?: { collapsed?: boolean; overlay?: boolean }) => {
  mockMatchMedia(options?.overlay ? 800 : 1440);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: Page }, { path: "/overview", component: Page }],
  });
  await router.push("/");
  await router.isReady();
  const pinia = createPinia();
  setActivePinia(pinia);
  configureAdminRuntime({
    appCode: "test-admin",
    branding: { title: "Test" },
    login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
    plugins: [],
  });
  useAppStateStore().menuOpenStatus = options?.collapsed ? false : true;
  useRouterStore().menus = sidebarNavigationFixture;
  const shell = createShell({ isOverlay: options?.overlay, overlayOpen: Boolean(options?.overlay) });
  const wrapper = mount(InMenu, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      provide: { [shellLayoutKey as symbol]: shell },
      stubs: {
        ElScrollbar: { template: '<div class="el-scrollbar"><slot /></div>' },
        ElMenu: { template: '<div class="el-menu"><slot /></div>' },
        InSubmenu: { template: '<div class="in-submenu-stub" />' },
        InIcon: true,
      },
    },
  });
  return { wrapper, shell };
};

describe("InMenu", () => {
  beforeEach(() => {
    mockMatchMedia(1440);
  });

  afterEach(() => {
    resetAdminRuntime();
    document.body.innerHTML = "";
  });

  it("菜单滚动视口与底部控制是 DOM 兄弟，控制不在滚动区内", async () => {
    const { wrapper } = await mountMenu();
    const scroll = wrapper.get("[data-testid='menu-scroll-viewport']");
    const control = wrapper.get(".in-menu__control");
    expect(scroll.element.contains(control.element)).toBe(false);
    expect(wrapper.get(".in-menu").element.children[0]).toBe(scroll.element);
    expect(wrapper.get(".in-menu__clearance").exists()).toBe(true);
    expect(wrapper.get(".in-menu__divider").exists()).toBe(true);
    expect(wrapper.get(".in-menu__divider-gap").exists()).toBe(true);
    expect(wrapper.get(".in-menu").classes()).toContain("select-none");
    expect(control.attributes("aria-label")).toBe("收起导航");
    expect(wrapper.get(".in-menu__control-icon").attributes("name")).toBe("ingot:ic_close");
    wrapper.unmount();
  });

  it("滚动菜单视口后底部控制仍是侧栏直接子节点且不进入滚动容器", async () => {
    const { wrapper } = await mountMenu();
    const scroll = wrapper.get("[data-testid='menu-scroll-viewport']").element as HTMLElement;
    const control = wrapper.get(".in-menu__control").element as HTMLElement;
    const filler = document.createElement("div");
    filler.style.height = "600px";
    scroll.appendChild(filler);
    scroll.style.height = "374px";
    scroll.style.overflow = "auto";
    const beforeParent = control.parentElement;
    scroll.scrollTop = 226;
    await nextTick();
    expect(scroll.scrollTop).toBeGreaterThan(200);
    expect(control.parentElement).toBe(beforeParent);
    expect(scroll.contains(control)).toBe(false);
    wrapper.unmount();
  });

  it("收起态文案为展开导航，且不启用 Element Plus collapse popper", async () => {
    const { wrapper } = await mountMenu({ collapsed: true });
    expect(wrapper.get(".in-menu").classes()).toContain("is-collapsed");
    expect(wrapper.get(".in-menu__control").attributes("aria-label")).toBe("展开导航");
    expect(wrapper.get(".in-menu__control-icon").attributes("name")).toBe("ingot:ic_expand");
    expect(wrapper.find(".in-menu__control-text").exists()).toBe(false);
    wrapper.unmount();
  });

  it("overlay 控制文案为关闭导航，不改写桌面展开偏好", async () => {
    const { wrapper } = await mountMenu({ overlay: true });
    expect(wrapper.get(".in-menu__control").text()).toContain("关闭导航");
    expect(wrapper.get(".in-menu__control-icon").attributes("name")).toBe("ingot:ic_close");
    expect(useAppStateStore().menuOpenStatus).toBe(true);
    await wrapper.get(".in-menu__control").trigger("click");
    expect(useAppStateStore().menuOpenStatus).toBe(true);
    wrapper.unmount();
  });
});

describe("InMenuToggle", () => {
  afterEach(() => {
    resetAdminRuntime();
  });

  it("桌面不渲染重复折叠入口", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
    });
    const wrapper = mount(InMenuToggle, {
      global: {
        plugins: [pinia],
        provide: { [shellLayoutKey as symbol]: createShell({ isOverlay: false }) },
      },
    });
    expect(wrapper.find("button").exists()).toBe(false);
    wrapper.unmount();
  });

  it("overlay 只开关覆盖层", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
    });
    useAppStateStore().menuOpenStatus = true;
    const shell = createShell({ isOverlay: true, overlayOpen: true });
    const wrapper = mount(InMenuToggle, {
      global: {
        plugins: [pinia],
        provide: { [shellLayoutKey as symbol]: shell },
        stubs: { ElIcon: true },
      },
    });
    expect(wrapper.get("button").attributes("aria-label")).toBe("关闭导航");
    await wrapper.get("button").trigger("click");
    expect(shell.overlayOpen.value).toBe(false);
    expect(useAppStateStore().menuOpenStatus).toBe(true);
    wrapper.unmount();
  });
});
