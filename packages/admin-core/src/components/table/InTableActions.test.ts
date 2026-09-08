import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOMWrapper, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import InTableActions from "./InTableActions.vue";
import type { InTableAction } from "../types";

const warning = vi.fn().mockResolvedValue(true);

vi.mock("@/hooks/web/useMessage", () => ({
  useMessageConfirm: () => ({ warning, error: warning, success: warning }),
}));

const row = { id: "1" };
const noop = vi.fn();
const stubs = { ElTooltip: { template: "<div><slot /></div>" }, InIcon: true };

const findMenu = () => document.body.querySelector<HTMLElement>("[role='menu']");
const findMenuItem = (label: string) =>
  new DOMWrapper(document.body.querySelector(`[role='menuitem'][aria-label='${label}']`)!);
const menuLabels = () =>
  [...document.body.querySelectorAll("[role='menuitem']")].map((item) => item.textContent?.trim());

const actions: Array<InTableAction<typeof row>> = [
  { key: "detail", label: "详情", kind: "detail", onSelect: noop },
  { key: "edit", label: "编辑", kind: "quick", onSelect: noop },
  { key: "enable", label: "启用", kind: "default", onSelect: noop },
  {
    key: "delete",
    label: "删除",
    kind: "danger",
    confirm: "确认删除该成员？",
    onSelect: noop,
  },
  {
    key: "grant",
    label: "授权",
    kind: "default",
    disabled: true,
    disabledReason: "当前账号无权限",
    onSelect: noop,
  },
];

describe("InTableActions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    noop.mockClear();
    warning.mockClear();
  });

  it("行内只渲染详情和高频动作，其余进入更多菜单", async () => {
    const wrapper = mount(InTableActions, {
      props: { actions, row },
      attachTo: document.body,
      global: { stubs },
    });
    const inline = wrapper.findAll(".in-table-actions__inline").map((item) => item.text());
    expect(inline).toEqual(["详情", "编辑"]);
    expect(wrapper.get("[aria-label='更多'] svg").exists()).toBe(true);
    await wrapper.get("[aria-label='更多']").trigger("click");
    expect(menuLabels()).toEqual(["启用", "删除", "授权"]);
    expect(document.body.querySelector(".in-table-actions__item.is-active")).toBeNull();
    wrapper.unmount();
  });

  it("指针悬停更多按钮即弹出菜单，离开后关闭", async () => {
    const wrapper = mount(InTableActions, {
      props: { actions, row },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.get(".in-table-actions__more").trigger("pointerenter", { pointerType: "mouse" });
    await wrapper.vm.$nextTick();
    expect(findMenu()).not.toBeNull();
    expect(wrapper.get("[aria-label='更多']").classes()).toContain("is-open");
    expect(document.body.querySelector(".in-table-actions__item.is-active")).toBeNull();

    vi.useFakeTimers();
    await wrapper.get(".in-table-actions__more").trigger("pointerleave", { pointerType: "mouse" });
    await vi.advanceTimersByTimeAsync(160);
    expect(findMenu()).toBeNull();
    wrapper.unmount();
    vi.useRealTimers();
  });

  it("禁用动作展示原因且不触发回调", async () => {
    const wrapper = mount(InTableActions, {
      props: { actions, row },
      attachTo: document.body,
      global: { stubs },
    });
    await wrapper.get("[aria-label='更多']").trigger("click");
    const grant = findMenuItem("授权，当前账号无权限");
    expect(grant.attributes("title")).toBe("当前账号无权限");
    await grant.trigger("click");
    expect(noop).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("危险动作先确认再回调，Esc 关闭菜单并恢复焦点", async () => {
    const wrapper = mount(InTableActions, {
      props: { actions, row },
      attachTo: document.body,
      global: { stubs },
    });
    const trigger = wrapper.get("[aria-label='更多']");
    await trigger.trigger("click");
    await findMenuItem("删除").trigger("click");
    expect(warning).toHaveBeenCalledWith("确认删除该成员？", { title: "提示" });
    expect(noop).toHaveBeenCalledWith(row);

    await trigger.trigger("click");
    expect(findMenu()).not.toBeNull();
    await new DOMWrapper(findMenu()!).trigger("keydown", { key: "Escape" });
    expect(findMenu()).toBeNull();
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it("toolbar 未选择时仍渲染批量组，并允许禁用", async () => {
    const toolbarActions: Array<InTableAction<{ selected: string[] }>> = [
      {
        key: "leave",
        label: "批量操作离职",
        kind: "danger",
        overflow: "auto",
        overflowGroup: "batch",
        priority: 10,
        disabled: true,
        disabledReason: "请先选择成员",
        onSelect: noop,
      },
      {
        key: "invite",
        label: "邀请成员",
        kind: "default",
        overflow: "never",
        priority: 40,
        onSelect: noop,
      },
      {
        key: "add",
        label: "添加成员",
        kind: "quick",
        overflow: "never",
        priority: 50,
        onSelect: noop,
      },
    ];
    const wrapper = mount(InTableActions, {
      props: {
        actions: toolbarActions,
        row: { selected: [] },
        variant: "toolbar",
        selectedCount: 0,
      },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    const labels = wrapper
      .findAll("button.in-table-actions__inline")
      .map((item) => item.text().trim());
    expect(labels).toEqual(["批量操作离职", "邀请成员", "添加成员"]);
    expect(wrapper.get("[aria-label='批量操作离职']").attributes("disabled")).toBeDefined();
    wrapper.unmount();
  });

  it("toolbar 收纳后更多在固定操作左侧，宽度足够时整组直出", async () => {
    const widths: Record<string, number> = {
      leave: 108,
      dept: 108,
      import: 112,
      invite: 98,
      add: 98,
    };
    const toolbarActions: Array<InTableAction<typeof row>> = [
      {
        key: "leave",
        label: "批量操作离职",
        kind: "danger",
        overflow: "auto",
        overflowGroup: "batch",
        priority: 10,
        onSelect: noop,
      },
      {
        key: "dept",
        label: "批量变更部门",
        kind: "default",
        overflow: "auto",
        overflowGroup: "batch",
        priority: 20,
        onSelect: noop,
      },
      {
        key: "import",
        label: "批量导入/导出",
        kind: "default",
        overflow: "auto",
        overflowGroup: "batch",
        priority: 30,
        onSelect: noop,
      },
      {
        key: "invite",
        label: "邀请成员",
        kind: "default",
        overflow: "never",
        priority: 40,
        onSelect: noop,
      },
      {
        key: "add",
        label: "添加成员",
        kind: "quick",
        overflow: "never",
        priority: 50,
        onSelect: noop,
      },
    ];
    const original = Element.prototype.getBoundingClientRect;
    const mockRect = (width: number) =>
      ({
        width,
        height: 32,
        top: 0,
        left: 0,
        bottom: 32,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => undefined,
      }) as DOMRect;

    const visibleLabels = (wrapper: ReturnType<typeof mount>) =>
      [...wrapper.element.querySelectorAll("button")]
        .map((item) => item.getAttribute("aria-label"))
        .filter((item): item is string => Boolean(item));

    Element.prototype.getBoundingClientRect = function mockRectForLayout(this: Element) {
      if (this.classList.contains("in-table-actions")) {
        return mockRect(360);
      }
      const key = (this as HTMLElement).dataset.actionKey;
      return mockRect(key ? (widths[key] ?? 98) : 32);
    };

    const wrapper = mount(InTableActions, {
      props: { actions: toolbarActions, row, variant: "toolbar" },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(visibleLabels(wrapper)).toEqual(["更多", "邀请成员", "添加成员"]);
    wrapper.unmount();

    Element.prototype.getBoundingClientRect = function mockWideRect(this: Element) {
      if (this.classList.contains("in-table-actions")) {
        return mockRect(1200);
      }
      const key = (this as HTMLElement).dataset.actionKey;
      return mockRect(key ? (widths[key] ?? 98) : 32);
    };

    const wide = mount(InTableActions, {
      props: { actions: toolbarActions, row, variant: "toolbar" },
      global: { stubs },
    });
    await wide.vm.$nextTick();
    await wide.vm.$nextTick();
    expect(visibleLabels(wide)).toEqual([
      "批量操作离职",
      "批量变更部门",
      "批量导入/导出",
      "邀请成员",
      "添加成员",
    ]);
    wide.unmount();
    Element.prototype.getBoundingClientRect = original;
  });

  it("工具栏可配置图标，primary 为描边主色，quick 为实心主操作", async () => {
    const toolbarActions: Array<InTableAction<typeof row>> = [
      {
        key: "invite",
        label: "邀请成员",
        kind: "primary",
        icon: "ep:plus",
        overflow: "never",
        priority: 40,
        onSelect: noop,
      },
      {
        key: "add",
        label: "添加成员",
        kind: "quick",
        icon: "ep:plus",
        overflow: "never",
        priority: 50,
        onSelect: noop,
      },
    ];
    const wrapper = mount(InTableActions, {
      props: { actions: toolbarActions, row, variant: "toolbar" },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();

    const invite = wrapper.get("[aria-label='邀请成员']");
    expect(invite.classes()).toContain("is-primary");
    expect(invite.classes()).not.toContain("is-filled");
    expect(invite.find("in-icon-stub").attributes("name")).toBe("ep:plus");

    const add = wrapper.get("[aria-label='添加成员']");
    expect(add.classes()).toContain("is-filled");
    expect(add.classes()).not.toContain("is-primary");
    expect(add.find("in-icon-stub").attributes("name")).toBe("ep:plus");
    wrapper.unmount();
  });

  it("唯一固定操作为 primary 时保持描边，不升格为实心", async () => {
    const wrapper = mount(InTableActions, {
      props: {
        actions: [
          {
            key: "invite",
            label: "邀请成员",
            kind: "primary",
            overflow: "never",
            onSelect: noop,
          },
        ],
        row,
        variant: "toolbar",
      },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    const invite = wrapper.get("[aria-label='邀请成员']");
    expect(invite.classes()).toContain("is-primary");
    expect(invite.classes()).not.toContain("is-filled");
    wrapper.unmount();
  });

  it("toolbar 选择后刷新禁用态", async () => {
    const wrapper = mount(InTableActions, {
      props: {
        actions: [
          {
            key: "batch-delete",
            label: "批量删除",
            kind: "danger",
            overflow: "never",
            disabled: true,
            disabledReason: "请先选择部门",
            onSelect: noop,
          },
        ],
        row,
        variant: "toolbar",
        selectedCount: 0,
      },
      global: { stubs },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.get("[aria-label='批量删除']").attributes("disabled")).toBeDefined();

    await wrapper.setProps({
      selectedCount: 2,
      actions: [
        {
          key: "batch-delete",
          label: "批量删除",
          kind: "danger",
          overflow: "never",
          disabled: false,
          confirm: "是否删除已选的 2 个部门",
          onSelect: noop,
        },
      ],
    });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.get("[aria-label='批量删除']").attributes("disabled")).toBeUndefined();
    wrapper.unmount();
  });
});
