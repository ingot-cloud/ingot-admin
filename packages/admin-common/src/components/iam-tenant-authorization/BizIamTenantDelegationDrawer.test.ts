// @vitest-environment jsdom
import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import Drawer from "./BizIamTenantDelegationDrawer.vue";
import {
  ScopeBindingKind,
  ScopeKind,
  type TenantAssignmentApis,
  type TenantDelegationApis,
} from "../../models/iam";

vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCapabilities: () => ({ unavailable: ref(false), contextEpoch: ref(0), hasAction: () => true }),
  refreshSessionPermissions: vi.fn().mockResolvedValue(undefined),
  confirmUnsavedChanges: vi.fn().mockResolvedValue(true),
  objectActionAllowed: () => ({ allowed: true }),
  Message: { success: vi.fn(), warning: vi.fn() },
}));
vi.mock("../../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));

const roleDefinition = {
  items: [
    {
      actionId: "a1",
      actionCode: "iam-tenant:member:read",
      actionName: "查看成员",
      applicationId: "1",
      applicationName: "组织治理",
      resourceId: "r1",
      resourceName: "成员",
      enabled: true,
      scopeCapabilities: [ScopeKind.ALL, ScopeKind.MANAGED_DEPARTMENTS],
      parameterDefinitions: [],
    },
  ],
  definition: { grants: [], parameterDefinitions: [] },
};
const assignmentApis = (): TenantAssignmentApis =>
  ({
    optionsAPI: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 20 } }),
    roleAPI: vi.fn().mockResolvedValue({ data: roleDefinition }),
    mineAPI: vi.fn(),
    scopeAPI: vi.fn(),
    createAPI: vi.fn(),
    previewAPI: vi.fn(),
    updateAPI: vi.fn(),
  }) as unknown as TenantAssignmentApis;
const delegationApis = (): TenantDelegationApis => ({
  createAPI: vi.fn().mockResolvedValue({ data: { id: "9", version: "1" } }),
  detailAPI: vi.fn().mockResolvedValue({
    data: {
      record: {
        id: "9",
        status: "ACTIVE",
        administratorName: "小鹏",
        scopeIssues: [],
        delegation: {
          administratorMemberId: "7",
          allowedRoleIds: ["3"],
          recipientSelection: { members: ["8"], departments: [] },
          resourceScopeCeilings: [],
          maxAssignmentDuration: "P7D",
          assignmentDurationMode: "LIMITED",
        },
      },
      fieldAccess: {},
      capabilities: {},
      version: "1",
    },
  }),
  updateAPI: vi.fn(),
  previewAPI: vi.fn().mockResolvedValue({
    data: { valid: true, errors: [], warnings: [], effectiveResult: { affectedAssignmentIds: [] } },
  }),
  scopeAPI: vi.fn(),
});
const stubs = {
  InDrawer: { props: ["modelValue", "title"], template: "<div v-if='modelValue'><h1>{{ title }}</h1><slot/><slot name='footer'/></div>" },
  InForm: { template: "<form><slot/></form>" },
  ElFormItem: { template: "<label><slot/></label>" },
  ElAlert: { props: ["title"], template: "<p>{{ title }}</p>" },
  ElSelect: {
    template:
      "<div class='scope-select'><slot/><button type='button' class='pick-objects' @click=\"$emit('change', 'OBJECT_SET')\">指定对象</button></div>",
  },
  ElOption: { template: "<span></span>" },
  ElCheckbox: true,
  InButton: {
    props: ["disabled"],
    template: "<button :disabled='disabled' @click=\"$emit('inClick')\"><slot/></button>",
  },
  BizIamWizardNav: true,
  BizIamDelegationCandidatePicker: {
    props: ["placeholder", "query"],
    template: "<div class='scope-picker'>{{ placeholder }} {{ query?.parameterKey }}</div>",
  },
  BizIamDelegationOperationTree: { props: ["actions"], template: "<div class='ops'>{{ actions.map((item) => item.name).join('、') }}</div>" },
  BizIamDurationFields: true,
  BizIamPreviewAlert: true,
};
const setup = () => {
  const delegations = delegationApis();
  const assignments = assignmentApis();
  const wrapper = mount(Drawer, {
    props: { apis: delegations, assignmentApis: assignments, departmentCandidates: vi.fn() },
    global: { stubs },
  });
  return { wrapper, delegations, assignments };
};

describe("BizIamTenantDelegationDrawer", () => {
  it("创建委派使用四步向导，角色不按等级选择", async () => {
    const { wrapper } = setup();
    await wrapper.vm.show();
    await flushPromises();
    expect(wrapper.text()).toContain("创建委派");
    expect(wrapper.text()).toContain("委派信息");
    expect(wrapper.text()).toContain("选择当前角色");
    expect(wrapper.text()).not.toContain("角色版本");
    expect(wrapper.text()).not.toContain("固定版本");
  });

  it("详情只读打开，并按当前角色加载资源", async () => {
    const { wrapper, delegations, assignments } = setup();
    await wrapper.vm.show(
      {
        record: { id: "9" },
        version: "0",
        fieldAccess: {},
        capabilities: {},
      } as never,
      "detail",
    );
    await flushPromises();
    expect(delegations.detailAPI).toHaveBeenCalledWith("9");
    expect(assignments.roleAPI).toHaveBeenCalledWith("3");
    expect(wrapper.text()).toContain("委派详情");
    expect(wrapper.text()).not.toContain("创建委派");
    expect(wrapper.text()).not.toContain("保存");
    const buttons = wrapper.findAll("button").map((button) => button.text());
    expect(buttons).toContain("下一步");
    await wrapper.findAll("button").find((button) => button.text() === "下一步")!.trigger("click");
    expect(wrapper.text()).toContain("确认操作");
    expect(wrapper.text()).toContain("查看成员");
  });

  it("指定对象在角色未声明部门参数时仍显示范围选择框", async () => {
    const delegations = delegationApis();
    delegations.detailAPI = vi.fn().mockResolvedValue({
      data: {
        record: {
          id: "9",
          status: "ACTIVE",
          administratorName: "小鹏",
          scopeIssues: [],
          delegation: {
            administratorMemberId: "7",
            allowedRoleIds: ["3"],
            recipientSelection: { members: ["8"], departments: [] },
            resourceScopeCeilings: [
              { resourceId: "d1", scopes: [{ kind: ScopeKind.ALL }], scopeBindings: {} },
              {
                resourceId: "m1",
                scopes: [{ kind: ScopeKind.OBJECT_SET, parameterKey: "member-objects" }],
                scopeBindings: { "member-objects": { kind: ScopeBindingKind.OBJECTS, ids: ["8"] } },
              },
            ],
            maxAssignmentDuration: "P7D",
            assignmentDurationMode: "LIMITED",
          },
        },
        fieldAccess: {},
        capabilities: {},
        version: "1",
      },
    });
    const assignments = assignmentApis();
    assignments.roleAPI = vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            actionId: "a1",
            actionCode: "iam-tenant:department:read",
            actionName: "查看部门",
            applicationId: "1",
            applicationName: "组织治理",
            resourceId: "d1",
            resourceName: "部门",
            enabled: true,
            scopeCapabilities: [ScopeKind.ALL, ScopeKind.OBJECT_SET, ScopeKind.MANAGED_DEPARTMENTS],
            parameterDefinitions: [],
          },
          {
            actionId: "a2",
            actionCode: "iam-tenant:member:read",
            actionName: "查看成员",
            applicationId: "1",
            applicationName: "组织治理",
            resourceId: "m1",
            resourceName: "成员",
            enabled: true,
            scopeCapabilities: [ScopeKind.ALL, ScopeKind.OBJECT_SET],
            parameterDefinitions: [
              { key: "member-objects", kind: ScopeBindingKind.OBJECTS, resourceId: "m1" },
            ],
          },
        ],
        definition: {
          grants: [],
          parameterDefinitions: [
            { key: "member-objects", kind: ScopeBindingKind.OBJECTS, resourceId: "m1" },
          ],
        },
      },
    });
    const wrapper = mount(Drawer, {
      props: { apis: delegations, assignmentApis: assignments, departmentCandidates: vi.fn() },
      global: { stubs },
    });
    await wrapper.vm.show(
      { record: { id: "9" }, version: "0", fieldAccess: {}, capabilities: {} } as never,
      "edit",
    );
    await flushPromises();
    await wrapper.findAll("button").find((button) => button.text() === "下一步")!.trigger("click");
    await wrapper.findAll("button").find((button) => button.text() === "下一步")!.trigger("click");
    expect(wrapper.text()).toContain("设置范围");
    expect(wrapper.text()).toContain("member-objects");
    expect(wrapper.text()).not.toContain("resource-d1-objects");
    const departmentSelect = wrapper.findAll(".scope-select")[0];
    await departmentSelect.find(".pick-objects").trigger("click");
    expect(wrapper.text()).toContain("请选择资源范围上限");
    expect(wrapper.text()).toContain("resource-d1-objects");
  });
});
