import { describe, expect, it } from "vitest";
import { DOMWrapper, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import InFilterPanel from "./InFilterPanel.vue";

const stubs = {
  ElTooltip: { template: "<div><slot /></div>" },
};

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(InFilterPanel, {
    props,
    slots: {
      default: "<input class='filter-field' placeholder='条件' />",
      footer: "<button type='button'>重置</button>",
    },
    attachTo: document.body,
    global: { stubs },
  });

describe("InFilterPanel", () => {
  it("触发器文案为筛选，可访问名称为筛选条件", () => {
    const wrapper = mountPanel();
    const trigger = wrapper.get("[aria-label='筛选条件']");
    expect(trigger.text()).toContain("筛选");
    expect(trigger.text()).not.toContain("更多");
    expect(trigger.attributes("aria-expanded")).toBe("false");
    expect(wrapper.find(".in-filter-panel__badge").exists()).toBe(false);
    wrapper.unmount();
  });

  it("active-count 大于 0 时显示数量角标", () => {
    const wrapper = mountPanel({ activeCount: 2 });
    expect(wrapper.get(".in-filter-panel__badge").text()).toBe("2");
    wrapper.unmount();
  });

  it("打开后 Teleport 到 body，Esc 关闭并恢复焦点", async () => {
    const wrapper = mountPanel();
    const trigger = wrapper.get("[aria-label='筛选条件']");
    await trigger.trigger("click");
    await nextTick();
    expect(trigger.attributes("aria-expanded")).toBe("true");
    const panel = document.body.querySelector(".in-filter-panel__panel");
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.getAttribute("role")).toBe("dialog");
    expect(panel?.textContent).toContain("重置");
    expect(wrapper.find(".in-filter-panel__panel").exists()).toBe(false);
    await new DOMWrapper(panel!).trigger("keydown", { key: "Escape" });
    await nextTick();
    expect(document.body.querySelector(".in-filter-panel__panel")).toBeNull();
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it("点击外部关闭，点击下拉浮层不关闭", async () => {
    const wrapper = mountPanel();
    await wrapper.get("[aria-label='筛选条件']").trigger("click");
    await nextTick();
    expect(document.body.querySelector(".in-filter-panel__panel")).toBeTruthy();

    const overlay = document.createElement("div");
    overlay.className = "el-popper";
    document.body.appendChild(overlay);
    overlay.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();
    expect(document.body.querySelector(".in-filter-panel__panel")).toBeTruthy();
    overlay.remove();

    document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();
    expect(document.body.querySelector(".in-filter-panel__panel")).toBeNull();
    wrapper.unmount();
  });
});
