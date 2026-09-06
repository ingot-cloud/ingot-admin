import { beforeEach, describe, expect, it } from "vitest";
import { DOMWrapper, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InColumnSetting from "./InColumnSetting.vue";
import { useUserInfoStore } from "@/stores/modules/auth";
import { COLUMN_SETTING_STORAGE_PREFIX } from "@/utils/uiPreference";

const headers = [
  { prop: "name", label: "名称", required: true },
  { prop: "phone", label: "手机号" },
  { prop: "email", label: "邮箱", hide: true },
  { prop: "actions", label: "操作" },
];

const stubs = {
  InIcon: true,
  ElTooltip: { template: "<div><slot /></div>" },
};

const openPanel = async (tableId = "member-list") => {
  const wrapper = mount(InColumnSetting, {
    props: { data: headers, tableId },
    attachTo: document.body,
    global: { stubs },
  });
  await wrapper.get("[aria-label='设置显示字段']").trigger("click");
  const panel = document.body.querySelector("[role='dialog']");
  return { wrapper, panel };
};

describe("InColumnSetting", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("全部半选、必选列禁用，切换后即时应用并持久化", async () => {
    const { wrapper, panel } = await openPanel();
    expect(panel?.textContent).toContain("请选择列表中要展示的信息");
    const inputs = [...(panel?.querySelectorAll("input[type='checkbox']") ?? [])] as HTMLInputElement[];
    expect(inputs[0]?.indeterminate).toBe(true);
    expect(inputs[1]?.disabled).toBe(true);
    expect(inputs[4]?.disabled).toBe(true);
    inputs[2]?.dispatchEvent(new Event("change", { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("onSelectionChange")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    expect(localStorage.getItem(`${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`)).toContain(
      "name",
    );
    wrapper.unmount();
  });

  it("Esc 关闭并恢复焦点，headers 别名可用", async () => {
    useUserInfoStore().userInfo.user = { nickname: "Ada" };
    const wrapper = mount(InColumnSetting, {
      props: { headers, tableId: "dept-list" },
      attachTo: document.body,
      global: { stubs },
    });
    const trigger = wrapper.get("[aria-label='设置显示字段']");
    await trigger.trigger("click");
    expect(document.body.querySelector("[role='dialog']")).not.toBeNull();
    await new DOMWrapper(document.body.querySelector("[role='dialog']")!).trigger("keydown", {
      key: "Escape",
    });
    expect(document.body.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it("浮层传送到 body 且可用拖拽柄调整顺序", async () => {
    const { wrapper, panel } = await openPanel();
    expect(wrapper.get("[aria-label='设置显示字段']").html()).toContain('viewBox="0 0 24 24"');
    expect(panel?.parentElement).toBe(document.body);
    expect(wrapper.find("[role='dialog']").exists()).toBe(false);
    const handles = [...(panel?.querySelectorAll("[aria-label='调整顺序']") ?? [])];
    expect(handles).toHaveLength(3);
    const nameRow = panel?.querySelectorAll(".in-column-setting__item")[1];
    const dispatchDrag = (target: EventTarget | null | undefined, type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", {
        value: { setData: () => undefined, effectAllowed: "move" },
      });
      target?.dispatchEvent(event);
    };
    dispatchDrag(handles[1], "dragstart");
    dispatchDrag(nameRow, "drop");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["phone", "name", "actions"]);
    wrapper.unmount();
  });

  it("兼容旧的选中数组持久化", async () => {
    localStorage.setItem(
      `${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`,
      JSON.stringify(["name", "actions"]),
    );
    const wrapper = mount(InColumnSetting, {
      props: { headers, tableId: "member-list" },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    wrapper.unmount();
  });
});
