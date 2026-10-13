import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { InAdminHeaderNavGroupTrigger, InAdminHeaderNavItemType } from "@/plugin/header";
import InAppBarNav from "./InAppBarNav.vue";
import type { ResolvedHeaderNavItem } from "./resolveHeaderConfig";

const applications: ResolvedHeaderNavItem[] = ["a", "b", "c", "d"].map((key) => ({
  key,
  label: `应用 ${key.toUpperCase()}`,
  type: InAdminHeaderNavItemType.Action,
  disabled: false,
  trigger: InAdminHeaderNavGroupTrigger.Click,
  groups: [],
}));
const applicationGroups = [
  { key: "office", title: "办公应用", items: applications.slice(0, 3) },
  { key: "tools", title: "业务工具", items: applications.slice(3) },
];

const mountApplications = (
  props: Partial<InstanceType<typeof InAppBarNav>["$props"]> = {},
  slots?: Record<string, string>,
) =>
  mount(InAppBarNav, {
    attachTo: document.body,
    props: {
      items: applications,
      visibleKeys: ["a", "b"],
      overflowKeys: ["c", "d"],
      showMore: true,
      overflowNavSlot: false,
      activeKey: "a",
      applicationMode: true,
      applicationGroups,
      ...props,
    },
    slots,
    global: { stubs: { InIcon: true, ElTooltip: { template: "<span><slot /></span>" } } },
  });

const panelFor = (wrapper: ReturnType<typeof mountApplications>): HTMLElement => {
  const id = wrapper.get("button[aria-label='更多应用']").attributes("aria-controls");
  const panel = document.getElementById(id);
  if (!(panel instanceof HTMLElement)) throw new Error("应用面板未挂载");
  return panel;
};

describe("应用更多面板", () => {
  it.each([0, 1, 2])("%s 个应用没有多余箭头", (count) => {
    const wrapper = mountApplications({
      items: applications.slice(0, count),
      visibleKeys: applications.slice(0, count).map((item) => item.key),
      overflowKeys: [],
      showMore: false,
    });
    expect(wrapper.find("button[aria-label='更多应用']").exists()).toBe(false);
    expect(wrapper.findAll("button.in-app-bar-nav__item")).toHaveLength(count);
    wrapper.unmount();
  });

  it("最后入口携带箭头，hover 不抢焦点，跨间隙进入分类面板后保持打开", async () => {
    vi.useFakeTimers();
    const outside = document.createElement("button");
    document.body.append(outside);
    const wrapper = mountApplications();
    try {
      outside.focus();
      expect(wrapper.find("button[aria-label='更多']").exists()).toBe(false);
      const trigger = wrapper.get(".in-app-bar-nav__application");
      expect(trigger.text()).toContain("应用 B");
      await trigger.trigger("mouseenter");
      expect(document.activeElement).toBe(outside);
      const panel = panelFor(wrapper);
      expect(panel.classList.contains("is-open")).toBe(true);
      expect([...panel.querySelectorAll("h3")].map((node) => node.textContent)).toEqual([
        "办公应用",
        "业务工具",
      ]);
      expect([...panel.querySelectorAll("button")].map((node) => node.textContent?.trim())).toEqual(
        ["应用 C", "应用 D"],
      );
      await trigger.trigger("mouseleave");
      await vi.advanceTimersByTimeAsync(80);
      panel.dispatchEvent(new MouseEvent("mouseenter"));
      await vi.advanceTimersByTimeAsync(200);
      expect(panel.classList.contains("is-open")).toBe(true);
      panel.dispatchEvent(new MouseEvent("mouseleave"));
      await vi.advanceTimersByTimeAsync(160);
      expect(panel.classList.contains("is-open")).toBe(false);
      expect(wrapper.emitted("select")).toBeUndefined();
    } finally {
      wrapper.unmount();
      outside.remove();
      vi.useRealTimers();
    }
  });

  it("箭头点击只展开，Escape 恢复箭头焦点，外部点击关闭", async () => {
    const wrapper = mountApplications();
    try {
      const arrow = wrapper.get("button[aria-label='更多应用']");
      await arrow.trigger("click");
      const panel = panelFor(wrapper);
      expect(arrow.attributes("aria-expanded")).toBe("true");
      expect(document.activeElement).toBe(panel);
      expect(wrapper.emitted("select")).toBeUndefined();
      panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await nextTick();
      expect(arrow.attributes("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(arrow.element);
      await arrow.trigger("click");
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await nextTick();
      expect(arrow.attributes("aria-expanded")).toBe("false");
      expect(wrapper.emitted("close-panel")?.at(-1)).toEqual(["nav-applications"]);
    } finally {
      wrapper.unmount();
    }
  });

  it("选择应用沿用 entryKey，切换后箭头随最后入口迁移；名称按钮仍能直接切换", async () => {
    const wrapper = mountApplications();
    try {
      await wrapper.get("button[aria-label='更多应用']").trigger("click");
      const entry = panelFor(wrapper).querySelector("button");
      entry?.click();
      await nextTick();
      expect(wrapper.emitted("select")?.[0]).toEqual([{ entryKey: "c" }]);
      await wrapper.setProps({ visibleKeys: ["a", "c"], overflowKeys: ["b", "d"], activeKey: "c" });
      expect(wrapper.get(".in-app-bar-nav__application").text()).toContain("应用 C");
      expect(
        wrapper
          .get(".in-app-bar-nav__application button.in-app-bar-nav__item")
          .attributes("aria-current"),
      ).toBe("page");
      expect(document.activeElement).toBe(wrapper.get("button[aria-label='更多应用']").element);
      await wrapper
        .get(".in-app-bar-nav__application button.in-app-bar-nav__item")
        .trigger("click");
      expect(wrapper.emitted("select")?.at(-1)).toEqual([{ entryKey: "c" }]);
    } finally {
      wrapper.unmount();
    }
  });

  it("打开期间过滤失效应用，实际溢出数量决定折列，失去全部溢出项时关闭", async () => {
    const entries = Array.from({ length: 10 }, (_, index) => ({
      ...applications[0]!,
      key: `app-${index}`,
    }));
    const wrapper = mountApplications({
      items: entries,
      visibleKeys: ["app-0", "app-1"],
      overflowKeys: entries.slice(2).map((item) => item.key),
      applicationGroups: [{ key: "all", title: "应用", items: entries }],
    });
    try {
      await wrapper.get("button[aria-label='更多应用']").trigger("click");
      const panel = panelFor(wrapper);
      const grid = panel.querySelector(".in-app-bar-nav-panel__items");
      expect(grid?.getAttribute("style")).toContain("--in-nav-group-columns: 1");
      await wrapper.setProps({ items: entries.slice(0, 3) });
      expect(panel.querySelectorAll("button")).toHaveLength(1);
      await wrapper.setProps({ items: entries.slice(0, 2), overflowKeys: [], showMore: false });
      expect(panel.classList.contains("is-open")).toBe(false);
      expect(wrapper.find("button[aria-label='更多应用']").exists()).toBe(false);
    } finally {
      wrapper.unmount();
    }
  });

  it("旧插槽只挂载一次，应用溢出时进入分类面板；仅插槽收纳时保留独立更多", async () => {
    const wrapper = mountApplications(
      { overflowNavSlot: true },
      { nav: '<button class="legacy-nav">旧入口</button>' },
    );
    try {
      await wrapper.get("button[aria-label='更多应用']").trigger("click");
      expect(document.body.querySelectorAll(".legacy-nav")).toHaveLength(1);
      expect(panelFor(wrapper).querySelector(".legacy-nav")).not.toBeNull();
      await wrapper.setProps({
        items: applications.slice(0, 2),
        overflowKeys: [],
        visibleKeys: ["a", "b"],
      });
      expect(wrapper.find("button[aria-label='更多应用']").exists()).toBe(false);
      await wrapper.get("button[aria-label='更多']").trigger("click");
      expect(document.body.querySelectorAll(".legacy-nav")).toHaveLength(1);
      expect(wrapper.get("[aria-label='更多导航'] .legacy-nav").exists()).toBe(true);
    } finally {
      wrapper.unmount();
    }
    expect(document.body.querySelector(".legacy-nav")).toBeNull();
  });
});
