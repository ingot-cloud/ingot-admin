import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useShellLayout } from "./useShellLayout";
import { SHELL_BREAKPOINT_NARROW } from "./types";
import { useAppStateStore } from "@/stores/modules/app";
import { resetAdminRuntime, configureAdminRuntime } from "@/runtime";

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

const Host = defineComponent({
  setup() {
    return { shell: useShellLayout() };
  },
  render() {
    return h("div");
  },
});

describe("useShellLayout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    configureAdminRuntime({
      appCode: "test-admin",
      branding: { title: "Test" },
      login: { loginUri: "/login", callbackUri: "/callback", fingerprintEnabled: false },
      plugins: [],
    });
    useAppStateStore().menuOpenStatus = true;
  });

  afterEach(() => {
    resetAdminRuntime();
  });

  it("宽屏使用持久化展开状态", () => {
    mockMatchMedia(1440);
    const wrapper = mount(Host);
    expect(wrapper.vm.shell.navigationMode.value).toBe("expanded");
    wrapper.unmount();
  });

  it("小于 1024px 使用覆盖层且不改写持久化状态", async () => {
    mockMatchMedia(SHELL_BREAKPOINT_NARROW - 1);
    const wrapper = mount(Host);
    expect(wrapper.vm.shell.navigationMode.value).toBe("overlay");
    expect(wrapper.vm.shell.overlayOpen.value).toBe(false);
    wrapper.vm.shell.toggleSidebar();
    expect(wrapper.vm.shell.overlayOpen.value).toBe(true);
    expect(useAppStateStore().menuOpenStatus).toBe(true);
    wrapper.vm.shell.closeOverlay();
    expect(wrapper.vm.shell.overlayOpen.value).toBe(false);
    wrapper.unmount();
  });

  it("桌面收起切换会更新持久化状态", () => {
    mockMatchMedia(1280);
    const wrapper = mount(Host);
    wrapper.vm.shell.toggleSidebar();
    expect(useAppStateStore().menuOpenStatus).toBe(false);
    expect(wrapper.vm.shell.navigationMode.value).toBe("collapsed");
    wrapper.unmount();
  });
});
