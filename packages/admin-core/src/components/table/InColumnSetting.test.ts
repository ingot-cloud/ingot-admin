import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InColumnSetting from "./InColumnSetting.vue";
import { useUserInfoStore } from "@/stores/modules/auth";
import { COLUMN_SETTING_STORAGE_PREFIX } from "@/utils/uiPreference";

const headers = [
  { prop: "name", label: "名称" },
  { prop: "phone", label: "手机号" },
  { prop: "actions", label: "操作" },
];

const stubs = {
  InIcon: true,
  ElTooltip: { template: "<div><slot /></div>" },
};

describe("InColumnSetting", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("全部半选、必选列禁用，切换后即时应用并持久化", async () => {
    const wrapper = mount(InColumnSetting, {
      props: { data: headers, tableId: "member-list" },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.get("[aria-label='设置显示字段']").trigger("click");
    const inputs = wrapper.findAll("input[type='checkbox']");
    expect((inputs[0].element as HTMLInputElement).indeterminate).toBe(false);
    const actionInput = wrapper.findAll("input[type='checkbox']")[3].element as HTMLInputElement;
    expect(actionInput.disabled).toBe(true);
    await wrapper.findAll("input[type='checkbox']")[2].setValue(false);
    expect(wrapper.emitted("onSelectionChange")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    expect(localStorage.getItem(`${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`)).toContain("name");
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
    expect(wrapper.find("[role='dialog']").exists()).toBe(true);
    await wrapper.get("[role='dialog']").trigger("keydown", { key: "Escape" });
    expect(wrapper.find("[role='dialog']").exists()).toBe(false);
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });
});
