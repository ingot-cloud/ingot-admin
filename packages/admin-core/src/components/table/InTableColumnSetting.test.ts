import { beforeEach, describe, expect, it } from "vitest";
import { DOMWrapper, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InTableColumnSetting from "./InTableColumnSetting.vue";
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
  const wrapper = mount(InTableColumnSetting, {
    props: { data: headers, tableId },
    attachTo: document.body,
    global: { stubs },
  });
  await wrapper.get("[aria-label='设置显示字段']").trigger("click");
  const panel = document.body.querySelector("[role='dialog']");
  return { wrapper, panel };
};

describe("InTableColumnSetting", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("全部半选、必选列禁用，切换后即时应用并持久化", async () => {
    const { wrapper, panel } = await openPanel();
    expect(panel?.textContent).toContain("请选择列表中要展示的信息");
    const inputs = [
      ...(panel?.querySelectorAll("input[type='checkbox']") ?? []),
    ] as HTMLInputElement[];
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
    const wrapper = mount(InTableColumnSetting, {
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
    const nameRow = panel?.querySelectorAll(".in-table-column-setting__item")[1];
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
    const wrapper = mount(InTableColumnSetting, {
      props: { headers, tableId: "member-list" },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "actions"]);
    wrapper.unmount();
  });

  it("异步权限列默认可见，初始化不保存尚未完整的列设置", async () => {
    const wrapper = mount(InTableColumnSetting, {
      props: { headers: [headers[0]!, headers[3]!], tableId: "member-list" },
      global: { stubs },
    });
    expect(localStorage.length).toBe(0);
    await wrapper.setProps({ headers });
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "phone", "actions"]);
    expect(localStorage.length).toBe(0);
    wrapper.unmount();
  });

  it("权限加载前后保留主动隐藏和排序，重新勾选列能显示", async () => {
    const key = `${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`;
    const saved = {
      selected: ["email", "name", "actions"],
      order: ["email", "name", "phone", "actions"],
    };
    localStorage.setItem(key, JSON.stringify(saved));
    const wrapper = mount(InTableColumnSetting, {
      props: { headers: [headers[0]!, headers[3]!], tableId: "member-list" },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.setProps({ headers });
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["email", "name", "actions"]);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(saved);
    await wrapper.get("[aria-label='设置显示字段']").trigger("click");
    const rows = [...document.body.querySelectorAll(".in-table-column-setting__item")];
    const phone = rows.find((row) => row.textContent?.includes("手机号"))!.querySelector("input")!;
    phone.dispatchEvent(new Event("change", { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["email", "name", "phone", "actions"]);
    wrapper.unmount();
  });

  it("用户修改当前列时不抹除暂时无权限列的显隐和顺序", async () => {
    const key = `${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`;
    localStorage.setItem(
      key,
      JSON.stringify({
        selected: ["email", "name", "phone", "actions"],
        order: ["email", "phone", "name", "actions"],
      }),
    );
    const { wrapper } = await openPanel();
    await wrapper.setProps({ data: headers.filter((item) => item.prop !== "email") });
    const rows = [...document.body.querySelectorAll(".in-table-column-setting__item")];
    rows
      .find((row) => row.textContent?.includes("手机号"))!
      .querySelector("input")!
      .dispatchEvent(new Event("change", { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(JSON.parse(localStorage.getItem(key)!).selected).toContain("email");
    await wrapper.setProps({ data: headers });
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["email", "name", "actions"]);
    expect(JSON.parse(localStorage.getItem(key)!).order).toEqual([
      "email",
      "phone",
      "name",
      "actions",
    ]);
    wrapper.unmount();
  });

  it("已保存的旧列集合不阻止新增权限列显示或切换", async () => {
    const key = `${COLUMN_SETTING_STORAGE_PREFIX}:browser:member-list`;
    localStorage.setItem(
      key,
      JSON.stringify({ selected: ["name", "actions"], order: ["name", "actions"] }),
    );
    const { wrapper, panel } = await openPanel();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toEqual(["name", "actions", "phone"]);
    const rows = [...panel!.querySelectorAll(".in-table-column-setting__item")];
    const phone = rows.find((row) => row.textContent?.includes("手机号"))!.querySelector("input")!;
    phone.dispatchEvent(new Event("change", { bubbles: true }));
    await wrapper.vm.$nextTick();
    phone.dispatchEvent(new Event("change", { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("change")?.at(-1)?.[0]).toContain("phone");
    wrapper.unmount();
  });
});
