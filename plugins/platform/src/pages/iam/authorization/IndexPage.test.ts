import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { reactive, ref, nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { usePermissions } from "@ingot/admin-core";
import {
  AssignmentSource,
  GrantStatus,
  IamAction,
  RoleKind,
  SubjectType,
} from "@ingot/admin-common";
import type { IamListQuery } from "@ingot/admin-common";
import IndexPage from "./IndexPage.vue";
import type { AssignmentRow } from "./table";

vi.mock("vue-router", async (original) => ({
  ...(await original<typeof import("vue-router")>()),
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("./useOps", () => ({ useOps: () => pagingOps }));
const upgradeOpen = vi.fn();
const refresh = vi.fn();
const row = (id: string, allowed = true): AssignmentRow => ({
  record: {
    id,
    subjectName: "成员" + id,
    roleName: "测试角色",
    revisionNumber: "1",
    assignment: {
      subject: { type: SubjectType.MEMBER, id },
      roleRevisionRef: { kind: RoleKind.PLATFORM_CUSTOM, id: "31" },
      scopeBindings: {},
    },
    source: AssignmentSource.MANUAL,
    status: GrantStatus.ACTIVE,
    effectiveStatus: allowed ? "ACTIVE" : "REVOKED",
  },
  version: "1",
  fieldAccess: {},
  capabilities: { [IamAction.PLATFORM_ASSIGNMENT_UPGRADE]: { allowed } },
});
const createPaging = () => ({
  fetching: ref(false),
  condition: reactive<IamListQuery>({}),
  pageInfo: ref({ current: 1, size: 20, total: 3, records: [row("1"), row("2"), row("3", false)] }),
  fetchData: vi.fn(),
});
let paging = createPaging();
let pagingOps = {
  roles: paging,
  assignments: paging,
  delegations: paging,
  refreshRoles: refresh,
  refreshAssignments: refresh,
  refreshDelegations: refresh,
};
const toolbarResize = new Set<() => void>();
let availableWidth = 500;
const rect = (width: number): DOMRect => ({
  width,
  height: 32,
  top: 0,
  left: 0,
  bottom: 32,
  right: width,
  x: 0,
  y: 0,
  toJSON: () => undefined,
});
const settle = async () => {
  await nextTick();
  await flushPromises();
  await nextTick();
};
const wrapperOf = () =>
  mount(IndexPage, {
    attachTo: document.body,
    global: {
      stubs: {
        InPageFrame: { template: "<div><slot name='header'/><slot/></div>" },
        InPageHeader: true,
        InSplitLayout: { template: "<div><slot/></div>" },
        InBizTabs: {
          name: "InBizTabs",
          props: ["modelValue"],
          emits: ["update:modelValue"],
          template: "<div><slot/></div>",
        },
        InBizTabPanel: { template: "<div><slot/></div>" },
        InTableColumnSetting: true,
        InPicker: {
          props: ["modelValue", "label"],
          emits: ["update:modelValue"],
          template: `<button class="filter" @click="$emit('update:modelValue', label === '状态' ? 'REVOKED' : 'GROUP')">{{ label }}</button>`,
        },
        ElPagination: true,
        ElTooltip: { template: "<span><slot/></span>" },
        RoleWorkspace: true,
        CreateWizard: true,
        SharedRoleDetailDrawer: true,
        BizIamPlatformAssignmentDrawer: true,
        BizIamPlatformDelegationDrawer: true,
        BizIamPlatformDiagnoseDrawer: true,
        BizIamAssignmentUpgradeDrawer: {
          name: "BizIamAssignmentUpgradeDrawer",
          template: "<div/>",
          methods: { open: upgradeOpen },
        },
      },
    },
  });
const toolbarOf = (wrapper: ReturnType<typeof wrapperOf>) => wrapper.get(".in-table__tools-end");
const bodyChecks = (wrapper: ReturnType<typeof wrapperOf>) =>
  wrapper.findAll(".el-table__body input[type=checkbox]");
const selectedText = (wrapper: ReturnType<typeof wrapperOf>) =>
  wrapper.get(".el-table__header").text().replace(/\s+/g, " ");
const toolbarLabels = (wrapper: ReturnType<typeof wrapperOf>) =>
  toolbarOf(wrapper)
    .findAll("button")
    .map((button) => button.attributes("aria-label"));

enableAutoUnmount(afterEach);
beforeEach(() => {
  setActivePinia(createPinia());
  usePermissions().permissions = [
    IamAction.PLATFORM_ASSIGNMENT_READ,
    IamAction.PLATFORM_ASSIGNMENT_CREATE,
    IamAction.PLATFORM_ASSIGNMENT_UPGRADE,
    IamAction.PLATFORM_AUTHORIZATION_DIAGNOSE,
  ];
  refresh.mockClear();
  upgradeOpen.mockClear();
  paging = createPaging();
  pagingOps = {
    roles: paging,
    assignments: paging,
    delegations: paging,
    refreshRoles: refresh,
    refreshAssignments: refresh,
    refreshDelegations: refresh,
  };
  availableWidth = 500;
  toolbarResize.clear();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.classList.contains("in-table-actions") && this.classList.contains("is-toolbar"))
      return rect(availableWidth);
    const key = (this as HTMLElement).dataset.actionKey;
    return rect(key === "upgrade" ? 140 : key ? 100 : 32);
  });
  vi.stubGlobal(
    "ResizeObserver",
    class implements ResizeObserver {
      private recalc: () => void;
      constructor(callback: ResizeObserverCallback) {
        this.recalc = () => callback([], this);
      }
      observe(target: Element) {
        if (target.classList.contains("in-table-actions")) toolbarResize.add(this.recalc);
      }
      unobserve() {
        toolbarResize.delete(this.recalc);
      }
      disconnect() {
        toolbarResize.delete(this.recalc);
      }
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("角色分配主体列勾选与操作栏", () => {
  it("主体内勾选、半选、当前页全选及数量一致，禁用记录不会进入升级", async () => {
    const wrapper = wrapperOf();
    await settle();
    expect(wrapper.find("th.el-table-column--selection").exists()).toBe(false);
    expect(bodyChecks(wrapper)).toHaveLength(3);
    expect(bodyChecks(wrapper)[2].attributes("disabled")).toBeDefined();
    const upgrade = toolbarOf(wrapper).get("[aria-label='批量升级版本']");
    expect(upgrade.attributes("disabled")).toBeDefined();
    expect(upgrade.attributes("title")).toBe("请先选择可升级的分配记录");
    await bodyChecks(wrapper)[0].setValue(true);
    await settle();
    expect(selectedText(wrapper)).toContain("主体 · 已选 1 条");
    expect(wrapper.find(".el-table__header .is-indeterminate").exists()).toBe(true);
    await wrapper.get(".el-table__header input[type=checkbox]").setValue(true);
    await settle();
    expect(selectedText(wrapper)).toContain("主体 · 已选 2 条");
    await upgrade.trigger("click");
    expect(upgradeOpen.mock.calls[0][0].map((item: AssignmentRow) => item.record.id)).toEqual([
      "1",
      "2",
    ]);
    await wrapper.get(".el-table__header input[type=checkbox]").setValue(false);
    await settle();
    expect(selectedText(wrapper)).not.toContain("已选");
    expect(upgrade.attributes("disabled")).toBeDefined();
  });

  it.each([
    "search",
    "clear",
    "status",
    "subject",
    "page",
    "size",
    "refresh",
    "success",
    "records",
    "loading",
    "context",
    "permission",
    "unavailable",
    "tab",
  ])("%s 后清空表格与页面选择", async (reason) => {
    const wrapper = wrapperOf();
    await settle();
    await bodyChecks(wrapper)[0].setValue(true);
    await settle();
    const table = wrapper.findComponent({ name: "InTable" });
    if (reason === "search")
      await wrapper.get(".in-table__tools-start input").trigger("keyup", { key: "Enter" });
    if (reason === "clear") wrapper.findComponent({ name: "ElInput" }).vm.$emit("clear");
    if (reason === "status") await wrapper.findAll("button.filter")[1].trigger("click");
    if (reason === "subject") await wrapper.findAll("button.filter")[0].trigger("click");
    if (reason === "page") table.vm.$emit("handleCurrentChange", { value: 2, type: "current" });
    if (reason === "size") table.vm.$emit("handleSizeChange", { value: 30, type: "size" });
    if (reason === "refresh" || reason === "success")
      wrapper
        .findComponent({
          name:
            reason === "success"
              ? "BizIamAssignmentUpgradeDrawer"
              : "BizIamPlatformAssignmentDrawer",
        })
        .vm.$emit("success");
    if (reason === "records") paging.pageInfo.value.records = [row("1"), row("2"), row("3", false)];
    if (reason === "loading") paging.fetching.value = true;
    if (reason === "context") usePermissions().bumpContextEpoch();
    if (reason === "permission")
      usePermissions().permissions = [IamAction.PLATFORM_ASSIGNMENT_READ];
    if (reason === "unavailable") usePermissions().markUnavailable();
    if (reason === "tab")
      wrapper.findComponent({ name: "InBizTabs" }).vm.$emit("update:modelValue", "delegations");
    await settle();
    expect(wrapper.text()).not.toContain("已选");
    expect(bodyChecks(wrapper).every((input) => !(input.element as HTMLInputElement).checked)).toBe(
      true,
    );
    if (reason === "loading") {
      const headerCheck = wrapper.get(".el-table__header input[type=checkbox]");
      expect(headerCheck.attributes("disabled")).toBeDefined();
      await headerCheck.setValue(true);
      expect(wrapper.text()).not.toContain("已选");
      paging.fetching.value = false;
      await settle();
      expect(
        bodyChecks(wrapper).every((input) => !(input.element as HTMLInputElement).checked),
      ).toBe(true);
    }
    const upgrade = wrapper.find(".in-table__tools-end [aria-label='批量升级版本']");
    if (upgrade.exists()) expect(upgrade.attributes("disabled")).toBeDefined();
    if (reason === "permission" || reason === "unavailable") {
      usePermissions().unavailable = false;
      usePermissions().permissions = [
        IamAction.PLATFORM_ASSIGNMENT_READ,
        IamAction.PLATFORM_ASSIGNMENT_UPGRADE,
      ];
      await settle();
      expect(selectedText(wrapper)).not.toContain("已选");
      expect(
        bodyChecks(wrapper).every((input) => !(input.element as HTMLInputElement).checked),
      ).toBe(true);
      expect(
        toolbarOf(wrapper).get("[aria-label='批量升级版本']").attributes("disabled"),
      ).toBeDefined();
    }
  });

  it("已选记录逐条能力失效时剔除，恢复能力也不恢复旧选择", async () => {
    const wrapper = wrapperOf();
    await settle();
    await bodyChecks(wrapper)[0].setValue(true);
    await settle();
    paging.pageInfo.value.records[0].capabilities[IamAction.PLATFORM_ASSIGNMENT_UPGRADE].allowed =
      false;
    await settle();
    expect(selectedText(wrapper)).not.toContain("已选");
    expect(bodyChecks(wrapper)[0].attributes("disabled")).toBeDefined();
    expect(
      toolbarOf(wrapper).get("[aria-label='批量升级版本']").attributes("disabled"),
    ).toBeDefined();
    paging.pageInfo.value.records[0].capabilities[IamAction.PLATFORM_ASSIGNMENT_UPGRADE].allowed =
      true;
    await settle();
    expect((bodyChecks(wrapper)[0].element as HTMLInputElement).checked).toBe(false);
  });

  it("无升级权限时不显示勾选框与升级入口", async () => {
    usePermissions().permissions = [
      IamAction.PLATFORM_ASSIGNMENT_READ,
      IamAction.PLATFORM_ASSIGNMENT_CREATE,
    ];
    const wrapper = wrapperOf();
    await settle();
    expect(bodyChecks(wrapper)).toHaveLength(0);
    expect(toolbarLabels(wrapper)).toEqual(["分配角色"]);
  });

  it("宽度变化依次收纳升级和诊断，菜单内禁用与执行一致，恢复直出", async () => {
    const wrapper = wrapperOf();
    await settle();
    expect(toolbarLabels(wrapper)).toEqual(["批量升级版本", "权限诊断", "分配角色"]);
    availableWidth = 290;
    toolbarResize.forEach((recalc) => recalc());
    await settle();
    expect(toolbarLabels(wrapper)).toEqual(["权限诊断", "更多", "分配角色"]);
    availableWidth = 180;
    toolbarResize.forEach((recalc) => recalc());
    await settle();
    expect(toolbarLabels(wrapper)).toEqual(["更多", "分配角色"]);
    await toolbarOf(wrapper).get("[aria-label='更多']").trigger("click");
    const upgrade = new DOMWrapper(
      document.body.querySelector<HTMLButtonElement>(
        "[role='menuitem'][title='请先选择可升级的分配记录']",
      )!,
    );
    expect(upgrade.attributes("disabled")).toBeDefined();
    await upgrade.trigger("click");
    expect(upgradeOpen).not.toHaveBeenCalled();
    await bodyChecks(wrapper)[0].setValue(true);
    await settle();
    const enabled = new DOMWrapper(
      document.body.querySelector<HTMLButtonElement>(
        "[role='menuitem'][aria-label='批量升级版本']",
      )!,
    );
    expect(enabled.attributes("disabled")).toBeUndefined();
    await enabled.trigger("click");
    expect(upgradeOpen).toHaveBeenCalledWith([paging.pageInfo.value.records[0]]);
    availableWidth = 500;
    toolbarResize.forEach((recalc) => recalc());
    await settle();
    expect(toolbarLabels(wrapper)).toEqual(["批量升级版本", "权限诊断", "分配角色"]);
  });
});
