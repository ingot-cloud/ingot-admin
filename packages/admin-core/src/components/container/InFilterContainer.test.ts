import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InFilterContainer from "./InFilterContainer.vue";
import { SHELL_BREAKPOINT_NARROW } from "@/layouts/main/types";
import { FILTER_LEFT_STORAGE_PREFIX } from "@/utils/uiPreference";

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

let resizeCallback: ResizeObserverCallback | undefined;

class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

const emitWidth = async (wrapper: ReturnType<typeof mount>, width: number) => {
  resizeCallback?.(
    [
      {
        contentRect: { width } as DOMRectReadOnly,
        target: wrapper.element,
      } as ResizeObserverEntry,
    ],
    {} as ResizeObserver,
  );
  await wrapper.vm.$nextTick();
};

const stubs = {
  ElContainer: { template: "<div class='el-container'><slot /></div>" },
  ElBacktop: true,
  ElTooltip: { template: "<div><slot /></div>" },
  InIcon: true,
};

describe("InFilterContainer", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    mockMatchMedia(1440);
    resizeCallback = undefined;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    mockMatchMedia(1440);
    vi.unstubAllGlobals();
  });

  it("左栏默认 260px 且可折叠到 0px，折叠后发出 update:left-open 并按用户路由持久化", async () => {
    const wrapper = mount(InFilterContainer, {
      props: {
        persistenceKey: "org-member",
      },
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-left-open");
    expect(wrapper.get(".left-filter").classes()).not.toContain("is-collapsed");
    expect(wrapper.get(".in-filter-container").attributes("style")).toContain("--in-filter-left-width: 260px");
    await wrapper.get("[aria-label='收起筛选']").trigger("click");
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-left-collapsed");
    expect(wrapper.get(".left-filter").classes()).toContain("is-collapsed");
    expect(wrapper.emitted("update:leftOpen")?.at(-1)?.[0]).toBe(false);
    expect(localStorage.getItem(`${FILTER_LEFT_STORAGE_PREFIX}:browser:org-member`)).toBe("false");
    wrapper.unmount();
  });

  it("窄屏左栏改为覆盖层，关闭不写回桌面持久化", async () => {
    mockMatchMedia(SHELL_BREAKPOINT_NARROW - 1);
    const wrapper = mount(InFilterContainer, {
      props: {
        leftCollapsible: true,
        persistenceKey: "org-member",
      },
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-left-overlay");
    await wrapper.get("[aria-label='展开筛选']").trigger("click");
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-left-overlay-open");
    await wrapper.get(".in-filter-container__mask").trigger("click");
    expect(wrapper.get(".in-filter-container").classes()).not.toContain("is-left-overlay-open");
    expect(localStorage.getItem(`${FILTER_LEFT_STORAGE_PREFIX}:browser:org-member`)).toBeNull();
    wrapper.unmount();
  });

  it("默认无边框直角，折叠柄与左栏宽度变化带 split 过渡", () => {
    const wrapper = mount(InFilterContainer, {
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-plain");
    expect(wrapper.get(".in-filter-container__collapse").exists()).toBe(true);
    wrapper.unmount();
  });

  it("左栏插槽渲染在带内边距的滚动区内", () => {
    const wrapper = mount(InFilterContainer, {
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".left-filter__scroll .tree").text()).toBe("tree");
    expect(wrapper.get(".in-filter-container__collapse").classes()).not.toContain("is-collapsed");
    wrapper.unmount();
  });

  it("左栏默认跟随容器背景，left-background 可单独覆盖", () => {
    const def = mount(InFilterContainer, {
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(def.get(".in-filter-container").attributes("style") ?? "").not.toContain("--in-filter-left-bg");
    def.unmount();

    const wrapper = mount(InFilterContainer, {
      props: { leftBackground: "#fbfbfb" },
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.get(".in-filter-container").attributes("style")).toContain("--in-filter-left-bg: #fbfbfb");
    wrapper.unmount();
  });

  it("left-collapsible=false 时不渲染折叠柄且左栏保持展开", () => {
    const wrapper = mount(InFilterContainer, {
      props: { leftCollapsible: false },
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    expect(wrapper.find(".in-filter-container__collapse").exists()).toBe(false);
    expect(wrapper.get(".left-filter").classes()).not.toContain("is-collapsed");
    wrapper.unmount();
  });

  it("容器窄于 leftWidth + minRightWidth 时临时收起，恢复宽度后还原手动展开且不写持久化", async () => {
    const wrapper = mount(InFilterContainer, {
      props: {
        persistenceKey: "org-member",
        minRightWidth: 680,
        leftWidth: 260,
      },
      slots: {
        left: "<div class='tree'>tree</div>",
        default: "<div class='table'>table</div>",
      },
      global: { stubs },
    });
    await emitWidth(wrapper, 1200);
    expect(wrapper.get(".left-filter").classes()).not.toContain("is-collapsed");
    await emitWidth(wrapper, 800);
    expect(wrapper.get(".in-filter-container").classes()).toContain("is-left-collapsed");
    expect(wrapper.emitted("update:leftOpen")).toBeUndefined();
    expect(localStorage.getItem(`${FILTER_LEFT_STORAGE_PREFIX}:browser:org-member`)).toBeNull();
    await emitWidth(wrapper, 1200);
    expect(wrapper.get(".left-filter").classes()).not.toContain("is-collapsed");
    wrapper.unmount();
  });
});
