import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import InBizTabsHeader from "./InBizTabsHeader.vue";

const tabsDir = dirname(fileURLToPath(import.meta.url));

describe("InBizTabs layout", () => {
  it("内容区定高，表格 Tab 用 fill 让表体滚动", () => {
    const tabs = readFileSync(resolve(tabsDir, "InBizTabs.vue"), "utf8");
    const panel = readFileSync(resolve(tabsDir, "InBizTabPanel.vue"), "utf8");
    expect(tabs).toContain("overflow: hidden");
    expect(tabs).not.toMatch(/\.inner-container \{[^}]*overflow: auto/);
    expect(panel).toContain("is-fill");
    expect(panel).toContain("fill:");
  });
});

describe("InBizTabsHeader", () => {
  it("方向键切换页内 Tab", async () => {
    const wrapper = mount(InBizTabsHeader, {
      props: {
        modelValue: "a",
        tabs: [
          { id: "a", title: "基本信息" },
          { id: "b", title: "权限" },
        ],
      },
    });
    await wrapper.get('[role="tablist"]').trigger("keydown", { key: "ArrowRight" });
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["b"]);
    expect(wrapper.emitted("change")?.[0]).toEqual(["b"]);
    expect(wrapper.find(".in-biz-tabs-ink").exists()).toBe(true);
    expect(wrapper.find(".in-biz-tabs-header__bar").exists()).toBe(true);
    expect(wrapper.find(".inner").exists()).toBe(true);
    wrapper.unmount();
  });

  it("before-change 返回 false 时不切换", async () => {
    const beforeChange = vi.fn().mockResolvedValue(false);
    const wrapper = mount(InBizTabsHeader, {
      props: {
        modelValue: "a",
        beforeChange,
        tabs: [
          { id: "a", title: "基本信息" },
          { id: "b", title: "工作信息" },
        ],
      },
    });
    await wrapper.findAll('[role="tab"]')[1]?.trigger("click");
    await nextTick();
    expect(beforeChange).toHaveBeenCalledWith("b");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    wrapper.unmount();
  });
});
