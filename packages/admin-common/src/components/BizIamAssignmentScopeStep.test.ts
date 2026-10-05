// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { describe, expect, it, vi } from "vitest";
import {
  RoleKind,
  ScopeBindingKind,
  ScopeKind,
  type AuthorizationOption,
  type AuthorizationCandidateQuery,
} from "../models/iam";
import {
  reconcileAssignmentRoles,
  type PlatformAssignmentRoleDraft,
} from "../models/iam/platformAssignment";
import BizIamAssignmentScopeStep from "./BizIamAssignmentScopeStep.vue";

const option: AuthorizationOption = {
  id: "50",
  name: "应用管理员 · v1",
  roleRevisionRef: { id: "50", kind: RoleKind.PLATFORM_CUSTOM },
  parameterDefinitions: [{ key: "internal_objects", kind: ScopeBindingKind.OBJECTS }],
  actions: ["60", "61", "62"].map((id) => ({
    id,
    name: id === "62" ? "删除应用" : "查看应用",
    applicationId: "1",
    applicationName: "平台管理",
    resourceId: "20",
    resourceName: "应用目录",
    code: `iam-platform:application:${id}`,
    scopeCapabilities: [ScopeKind.ALL, ScopeKind.OBJECT_SET],
  })),
  grants: ["60", "61", "62"].map((actionId) => ({
    actionId,
    scopes: [
      {
        kind: actionId === "62" ? ScopeKind.ALL : ScopeKind.OBJECT_SET,
        parameterKey: actionId === "62" ? undefined : "internal_objects",
      },
    ],
  })),
};
const stubs = {
  ElInput: true,
  ElCheckbox: {
    name: "ElCheckbox",
    props: ["modelValue"],
    emits: ["change"],
    template: "<label><slot /></label>",
  },
  ElTag: { template: "<span><slot /></span>" },
  ElPagination: {
    name: "ElPagination",
    props: ["currentPage", "total"],
    emits: ["currentChange"],
    template:
      "<div>第{{currentPage}}页<button @click=\"$emit('currentChange', 3)\">第三页</button></div>",
  },
  InButton: {
    emits: ["inClick"],
    template: "<button @click=\"$emit('inClick')\"><slot /></button>",
  },
  InBizTabsHeader: {
    props: ["modelValue", "tabs"],
    emits: ["update:modelValue"],
    template:
      '<div><button v-for="tab in tabs" :key="tab.id" @click="$emit(\'update:modelValue\', tab.id)">{{tab.title}}</button></div>',
  },
  ElAlert: { props: ["title"], template: "<span>{{title}}</span>" },
  InIcon: true,
  BizIamDelegationCandidatePicker: {
    name: "BizIamDelegationCandidatePicker",
    props: ["query", "modelValue", "selectedOptions", "loadSelected", "disabled"],
    emits: ["confirm"],
    template: "<button>对象选择</button>",
  },
};
describe("分配范围步骤", () => {
  it("编辑只加载当前配置页的已选名称，隐藏页和全部权限不额外请求", async () => {
    const roles = reconcileAssignmentRoles([], [manyConfigurations(45)]);
    for (let index = 0; index < 45; index++)
      roles[0].bindings[`objects_${index}`].ids = [String(index)];
    const selectedApi = vi.fn(async (query: AuthorizationCandidateQuery) => ({
      data: {
        items: [{ id: query.parameterKey!.split("_").at(-1)!, name: "已选对象" }],
        page: 1,
        pageSize: 20,
        total: 1,
        supported: true,
      },
    }));
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles, api: vi.fn(), selectedApi, resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    await flushPromises();
    expect(selectedApi).toHaveBeenCalledTimes(20);
    wrapper.findComponent({ name: "ElPagination" }).vm.$emit("currentChange", 3);
    await flushPromises();
    expect(selectedApi).toHaveBeenCalledTimes(25);
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "全部权限")!
      .trigger("click");
    await flushPromises();
    expect(selectedApi).toHaveBeenCalledTimes(25);
    wrapper.unmount();
  });
  it("编辑只读时回显名称，未加载的绑定 ID 保留且打开选择器复用已选第一页", async () => {
    const roles = reconcileAssignmentRoles([], [option]);
    roles[0].bindings.internal_objects.ids = Array.from({ length: 25 }, (_, index) =>
      String(100 + index),
    );
    const selectedApi = vi.fn(async () => ({
      data: {
        items: [{ id: "100", name: "已选应用" }],
        total: 25,
        page: 1,
        pageSize: 20,
        supported: true,
      },
    }));
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles, api: vi.fn(), selectedApi, resetKey: 1, readonly: true },
      global: { plugins: [createPinia()], stubs },
    });
    await flushPromises();
    const next = wrapper.emitted("update:roles")?.at(-1)?.[0] as PlatformAssignmentRoleDraft[];
    expect(next[0].bindings.internal_objects.ids).toHaveLength(25);
    expect(next[0].selectedObjects.internal_objects[0].name).toBe("已选应用");
    const load = wrapper
      .findComponent({ name: "BizIamDelegationCandidatePicker" })
      .props("loadSelected");
    await load({ kind: "OBJECT", page: 1, pageSize: 20 });
    expect(selectedApi).toHaveBeenCalledOnce();
  });
  it("默认只配置对象，共用参数出现一次，全部权限独立核对", async () => {
    const roles = reconcileAssignmentRoles([], [option]);
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles, api: vi.fn(), resetKey: 1, delegationGrantId: "70" },
      global: { plugins: [createPinia()], stubs },
    });
    expect(wrapper.text()).toContain("平台管理");
    expect(wrapper.text()).toContain("应用目录");
    expect(wrapper.text()).not.toContain("删除应用");
    expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain(
      "需配置 1 项，已配置 0 项，待配置 1 项",
    );
    expect(wrapper.text()).not.toContain("internal_objects");
    const picker = wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" });
    expect(picker).toHaveLength(1);
    expect(picker[0].props("query")).toMatchObject({
      kind: "OBJECT",
      revisionId: "50",
      parameterKey: "internal_objects",
      delegationGrantId: "70",
    });
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "全部权限")!
      .trigger("click");
    expect(wrapper.text()).toContain("删除应用");
    expect(wrapper.findComponent({ name: "BizIamDelegationOperationTree" }).text()).toContain(
      "全部",
    );
  });

  it("第三页遗漏在搜索和分页外统计，清单点击跳到对应配置页", async () => {
    const many = manyConfigurations(45);
    const roles = reconcileAssignmentRoles([], [many]);
    for (let index = 0; index < 40; index++)
      roles[0].bindings[`objects_${index}`].ids = [String(index)];
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles, api: vi.fn(), resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain(
      "需配置 45 项，已配置 40 项，待配置 5 项",
    );
    await wrapper.findComponent({ name: "ElInput" }).vm.$emit("update:modelValue", "找不到");
    await flushPromises();
    expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain("待配置 5 项");
    await wrapper.vm.showOutstanding();
    await flushPromises();
    wrapper.findComponent({ name: "ElInput" }).vm.$emit("update:modelValue", "资源44");
    await flushPromises();
    const target = wrapper.findAll("button").find((item) => item.text().includes("资源44"));
    expect(target).toBeDefined();
    await target!.trigger("click");
    await flushPromises();
    expect(wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" })).toHaveLength(5);
    expect(wrapper.findComponent({ name: "ElPagination" }).props("currentPage")).toBe(3);
    expect(wrapper.findComponent({ name: "ElInput" }).props("modelValue")).toBe("");
    wrapper.unmount();
  });

  it("编辑对象会更新绑定和全局进度，完成后筛选中的卡片保持原位置", async () => {
    const roles = reconcileAssignmentRoles([], [option]);
    roles[0].bindings.internal_objects.ids = ["100"];
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles, api: vi.fn(), resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    const picker = wrapper.findComponent({ name: "BizIamDelegationCandidatePicker" });
    expect(picker.props("disabled")).toBe(false);
    picker.vm.$emit("confirm", []);
    await flushPromises();
    let next = wrapper.emitted("update:roles")!.at(-1)![0] as PlatformAssignmentRoleDraft[];
    await wrapper.setProps({ roles: next });
    wrapper.findComponent({ name: "ElCheckbox" }).vm.$emit("change", true);
    await flushPromises();
    picker.vm.$emit("confirm", [
      { id: "101", name: "应用一" },
      { id: "102", name: "应用二" },
    ]);
    await flushPromises();
    next = wrapper.emitted("update:roles")!.at(-1)![0] as PlatformAssignmentRoleDraft[];
    await wrapper.setProps({ roles: next });
    expect(next[0].bindings.internal_objects.ids).toEqual(["101", "102"]);
    expect(wrapper.get('[data-testid="scope-progress"]').text()).toContain(
      "已配置 1 项，待配置 0 项",
    );
    expect(wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" })).toHaveLength(1);
    wrapper.unmount();
  });

  it("无需配置对象时明确提示，仍可查看全部权限", () => {
    const all = {
      ...option,
      parameterDefinitions: [],
      grants: [{ actionId: "62", scopes: [{ kind: ScopeKind.ALL }] }],
    };
    const wrapper = mount(BizIamAssignmentScopeStep, {
      props: { roles: reconcileAssignmentRoles([], [all]), api: vi.fn(), resetKey: 1 },
      global: { plugins: [createPinia()], stubs },
    });
    expect(wrapper.text()).toContain("所选角色无需配置具体对象");
    expect(wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" })).toHaveLength(0);
    wrapper.unmount();
  });
});

const manyConfigurations = (count: number): AuthorizationOption => ({
  ...option,
  parameterDefinitions: Array.from({ length: count }, (_, index) => ({
    key: `objects_${index}`,
    kind: ScopeBindingKind.OBJECTS,
  })),
  grants: Array.from({ length: count }, (_, index) => ({
    actionId: String(index),
    scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: `objects_${index}` }],
  })),
  actions: Array.from({ length: count }, (_, index) => ({
    ...option.actions![0],
    id: String(index),
    resourceId: String(index),
    resourceName: `资源${index}`,
  })),
});
