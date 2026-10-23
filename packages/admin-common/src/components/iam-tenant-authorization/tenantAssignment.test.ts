// @vitest-environment jsdom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import Drawer from "./BizIamTenantAssignmentDrawer.vue";
import {
  RoleKind,
  ConfigurationStatus,
  ScopeBindingKind,
  type TenantAssignmentApis,
} from "../../models/iam";
vi.mock("@ingot/admin-core", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCapabilities: () => ({ unavailable: ref(false), contextEpoch: ref(0), hasAction: () => true }),
  refreshSessionPermissions: vi.fn().mockResolvedValue(undefined),
  confirmUnsavedChanges: vi.fn().mockResolvedValue(true),
  Message: { success: vi.fn(), warning: vi.fn() },
}));
vi.mock("../../hooks/iamEditorFailure", () => ({ iamEditorFailure: vi.fn() }));
const emptyDefinition = { items: [], definition: { grants: [], parameterDefinitions: [] } };
const deptDefinition = {
  items: [
    {
      actionId: "a1",
      actionCode: "iam-tenant:member:read",
      actionName: "查看成员",
      applicationId: "1",
      applicationName: "组织",
      resourceId: "r1",
      resourceName: "部门",
      enabled: true,
      scopeCapabilities: [],
      parameterDefinitions: [],
    },
  ],
  definition: {
    grants: [],
    parameterDefinitions: [{ key: "dept", kind: ScopeBindingKind.DEPARTMENTS, resourceId: "r1" }],
  },
};
const role = (id: string) => ({
  id,
  name: `角色${id}`,
  code: `role-${id}`,
  kind: RoleKind.SHARED,
  status: ConfigurationStatus.ENABLED,
});
const source = (id: string, roleId: string) => ({
  id,
  allowedRoles: [role(roleId)],
  recipientSummary: "1名成员",
  maxAssignmentDuration: "P7D",
  scopeIssues: [],
  directAssignmentActions: [],
});
const preview = (count: number) => ({
  data: {
    valid: true,
    errors: [],
    warnings: [],
    version: "current",
    effectiveResult: {
      items: Array.from({ length: count }, () => ({ allowed: true, errors: [] })),
    },
  },
});
const apis = (): TenantAssignmentApis => ({
  mineAPI: vi.fn().mockResolvedValue({ data: [source("7", "1"), source("8", "2")] }),
  optionsAPI: vi.fn().mockResolvedValue({ data: { items: [], total: 0, page: 1, pageSize: 20 } }),
  roleAPI: vi.fn().mockResolvedValue({ data: emptyDefinition }),
  scopeAPI: vi.fn().mockResolvedValue({ data: { items: [], total: 0, supported: true } }),
  createAPI: vi.fn().mockResolvedValue({ data: { id: "100", version: "0" } }),
  previewAPI: vi.fn().mockImplementation(async (input) => preview(input.items.length)),
  updateAPI: vi.fn().mockResolvedValue({ data: {} }),
});
const stubs = {
  InDrawer: {
    props: ["modelValue"],
    template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
  },
  InForm: { template: "<div><slot/></div>" },
  ElFormItem: { template: "<div><slot/></div>" },
  ElSelect: { props: ["modelValue"], emits: ["update:modelValue"], template: "<div><slot/></div>" },
  ElOption: { props: ["value", "label"], template: "<span>{{label}}</span>" },
  ElAlert: { props: ["title"], template: "<div>{{title}}</div>" },
  ElTag: { template: "<span><slot/></span>" },
  ElCheckbox: true,
  InButton: {
    props: ["disabled"],
    emits: ["inClick", "click"],
    template:
      "<button :disabled=\"disabled\" @click=\"$emit('inClick'); $emit('click')\"><slot/></button>",
  },
  BizIamWizardNav: true,
  BizIamDelegationCandidatePicker: true,
  BizIamDurationFields: true,
  BizIamPreviewAlert: true,
};
const setup = (api: TenantAssignmentApis) =>
  mount(Drawer, { props: { apis: api }, global: { stubs } });
const pickers = (wrapper: VueWrapper) =>
  wrapper.findAllComponents({ name: "BizIamDelegationCandidatePicker" });
const click = async (wrapper: VueWrapper, label: string) => {
  await wrapper
    .findAll("button")
    .find((item) => item.text() === label)!
    .trigger("click");
  await flushPromises();
};
describe("租户分配角色向导", () => {
  it("委派身份自动使用本人来源，多成员 × 多角色一次提交", async () => {
    const api = apis(),
      wrapper = setup(api);
    await wrapper.vm.show();
    await flushPromises();
    expect(wrapper.findComponent(stubs.ElSelect).props("modelValue")).toBe("7");
    expect(
      wrapper.findAllComponents(stubs.ElOption).map((option) => option.props("label")),
    ).not.toContain("直接分配");
    const [memberPicker, groupPicker] = pickers(wrapper);
    expect(memberPicker.props("query")).toMatchObject({ kind: "MEMBER" });
    memberPicker.vm.$emit("confirm", [
      { id: "4", name: "张三" },
      { id: "5", name: "李四" },
    ]);
    groupPicker.vm.$emit("confirm", [{ id: "6", name: "运营组" }]);
    await flushPromises();
    await memberPicker.props("api")({ kind: "MEMBER", ids: ["4"], page: 1, pageSize: 20 });
    expect(api.optionsAPI).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "MEMBER", delegationGrantId: "7", ids: ["4"] }),
    );
    await click(wrapper, "下一步");
    const [rolePicker] = pickers(wrapper);
    expect(rolePicker.props("query")).toMatchObject({ kind: "ROLE" });
    rolePicker.vm.$emit("confirm", [
      { id: "1", name: "角色1" },
      { id: "2", name: "角色2" },
    ]);
    await flushPromises();
    expect(api.roleAPI).toHaveBeenCalledWith("1", "7");
    expect(wrapper.text()).toContain("请设置失效时间");
    wrapper
      .findComponent({ name: "BizIamDurationFields" })
      .vm.$emit("update:validUntil", new Date(Date.now() + 3_600_000).toISOString());
    await flushPromises();
    await click(wrapper, "下一步");
    expect(wrapper.text()).toContain("无需填写对象范围");
    await click(wrapper, "下一步");
    await click(wrapper, "预览效果");
    await click(wrapper, "分配角色");
    const input = vi.mocked(api.createAPI).mock.calls[0][0];
    expect(input.items).toHaveLength(6);
    expect(input.items[0]).toMatchObject({
      roleId: "1",
      delegationGrantId: "7",
      subject: { type: "MEMBER", id: "4" },
    });
    expect(input.items[5]).toMatchObject({ roleId: "2", subject: { type: "GROUP", id: "6" } });
    expect(JSON.stringify(input)).not.toMatch(/Revision|versionName|upgrade/);
  });
  it("切换来源清空接收对象与角色，旧角色响应不能恢复它们", async () => {
    const api = apis(),
      wrapper = setup(api);
    await wrapper.vm.show();
    await flushPromises();
    pickers(wrapper)[0].vm.$emit("confirm", [{ id: "4", name: "张三" }]);
    await flushPromises();
    await click(wrapper, "下一步");
    let resolve!: (value: { data: typeof emptyDefinition }) => void;
    vi.mocked(api.roleAPI).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    pickers(wrapper)[0].vm.$emit("confirm", [{ id: "1", name: "角色1" }]);
    await flushPromises();
    await click(wrapper, "上一步");
    wrapper.findComponent(stubs.ElSelect).vm.$emit("update:modelValue", "8");
    await flushPromises();
    resolve({ data: emptyDefinition });
    await flushPromises();
    expect(pickers(wrapper)[0].props("modelValue")).toEqual([]);
    await pickers(wrapper)[0].props("api")({ kind: "MEMBER", page: 1, pageSize: 20 });
    expect(api.optionsAPI).toHaveBeenLastCalledWith(
      expect.objectContaining({ delegationGrantId: "8" }),
    );
    expect(wrapper.find("button:disabled").text()).toBe("下一步");
  });
  it("范围未填写时阻止进入预览，并按角色查询范围候选", async () => {
    const api = apis();
    vi.mocked(api.mineAPI).mockResolvedValue({ data: [] });
    vi.mocked(api.roleAPI).mockResolvedValue({ data: deptDefinition });
    const wrapper = setup(api);
    await wrapper.vm.show();
    await flushPromises();
    expect(wrapper.text()).toContain("直接分配");
    pickers(wrapper)[0].vm.$emit("confirm", [{ id: "4", name: "张三" }]);
    await flushPromises();
    await click(wrapper, "下一步");
    pickers(wrapper)[0].vm.$emit("confirm", [{ id: "1", name: "角色1" }]);
    await flushPromises();
    await click(wrapper, "下一步");
    expect(wrapper.text()).toContain("已配置 0 / 1 项");
    await click(wrapper, "下一步");
    expect(wrapper.text()).toContain("已配置 0 / 1 项");
    const scopePicker = pickers(wrapper)[0];
    await scopePicker.props("api")({ kind: "OBJECT", parameterKey: "dept", page: 1, pageSize: 20 });
    expect(api.scopeAPI).toHaveBeenLastCalledWith(
      expect.objectContaining({ roleId: "1", parameterKey: "dept" }),
    );
    scopePicker.vm.$emit("confirm", [{ id: "9", name: "研发部" }]);
    await flushPromises();
    expect(wrapper.text()).toContain("已配置 1 / 1 项");
    await click(wrapper, "下一步");
    await click(wrapper, "预览效果");
    expect(wrapper.text()).toContain("研发部");
    await click(wrapper, "分配角色");
    expect(vi.mocked(api.createAPI).mock.calls[0][0].items[0].scopeBindings).toEqual({
      dept: { kind: ScopeBindingKind.DEPARTMENTS, ids: ["9"] },
    });
  });
  it("编辑单条分配锁定主体和角色，只提交范围与有效期", async () => {
    const api = apis();
    vi.mocked(api.mineAPI).mockResolvedValue({ data: [] });
    vi.mocked(api.roleAPI).mockResolvedValue({ data: deptDefinition });
    const wrapper = setup(api);
    await wrapper.vm.show({
      record: {
        id: "50",
        assignment: {
          subject: { type: "MEMBER", id: "4" },
          roleId: "1",
          scopeBindings: { dept: { kind: ScopeBindingKind.DEPARTMENTS, ids: ["9"] } },
        },
        subjectName: "张三",
        roleName: "角色1",
      },
      version: "3",
      capabilities: {},
    } as never);
    await flushPromises();
    expect(wrapper.text()).toContain("张三");
    expect(pickers(wrapper)).toHaveLength(0);
    await click(wrapper, "下一步");
    expect(wrapper.text()).toContain("角色1");
    await click(wrapper, "下一步");
    expect(wrapper.text()).toContain("已配置 1 / 1 项");
    await click(wrapper, "下一步");
    await click(wrapper, "预览效果");
    await click(wrapper, "保存");
    expect(api.updateAPI).toHaveBeenCalledWith("50", {
      expectedVersion: "3",
      assignment: expect.objectContaining({
        roleId: "1",
        subject: { type: "MEMBER", id: "4" },
        scopeBindings: { dept: { kind: ScopeBindingKind.DEPARTMENTS, ids: ["9"] } },
      }),
    });
  });
});
